/**
 * PairLens — Scan orchestrator (v2)
 *
 * Arquitetura corrigida:
 *   - Alinhamento PAIRWISE (não global) — evita perda de dados por interseção vazia
 *   - Comparação somente dentro do mesmo tipo (stock×stock, fii×fii, etc.)
 *   - Cap por tipo ordenado por ADV — universo controlado
 *   - Threshold de correlação 0.80 (mais restritivo que 0.70)
 *
 * Fluxo:
 *   1. Monta lista de candidatos (BRAPI list + Ibovespa fallback)
 *   2. Busca histórico 1y para todos os candidatos
 *   3. Calcula ADV de cada ticker a partir do volume das barras
 *   4. Filtra por liquidez mínima e aplica cap por tipo
 *   5. Para cada par do mesmo tipo: alinha por data, filtra correlação, roda ADF
 *   6. Insere cointegrated_pairs no banco
 */

import { createAdminClient } from './supabase'
import { getCandidateTickers, minAdvForType, parseSegments, type LiquidityConfig, type UniverseSegment } from './universe'
import {
  testCointegration,
  computeZScoreSeries,
  pearsonCorrelation,
  rankPair,
} from './stats'
import {
  fetchHistory,
  fetchQuotesBatched,
  alignPriceSeries,
  computeADVFromHistory,
  type TickerHistory,
} from './brapi'
import type { AssetType } from './brapi'

// ─────────────────────────────────────────────────────────────────────────────
// Progresso global (polled por /api/scan/status)
// ─────────────────────────────────────────────────────────────────────────────

export interface ScanProgress {
  running: boolean
  phase: 'idle' | 'universe' | 'fetching' | 'testing' | 'saving'
  tickersFetched: number
  tickersTotal: number
  pairsTested: number
  elapsedMs: number
  startedAt: number
  scanRunId: string | null
}

export const scanProgress: ScanProgress = {
  running: false,
  phase: 'idle',
  tickersFetched: 0,
  tickersTotal: 0,
  pairsTested: 0,
  elapsedMs: 0,
  startedAt: 0,
  scanRunId: null,
}

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

interface ScanConfig {
  zscoreThreshold: number
  lookbackWindow:  number
  minScore:        number
  minHalfLife:     number
  maxHalfLife:     number
  corrThreshold:   number
  capStock:        number
  capFII:          number
  capETF:          number
  capBDR:          number
  universeSegments: UniverseSegment[]
  liquidity:       LiquidityConfig
}

async function loadConfig(): Promise<ScanConfig> {
  const db = createAdminClient()
  const { data } = await db.from('config').select('key, value')
  const m = new Map((data ?? []).map((r: { key: string; value: string }) => [r.key, r.value]))

  const env = parseFloat(process.env.ZSCORE_THRESHOLD ?? '2.0')
  // universe_segments = "ibov,fii" (novo formato)
  // Retrocompatibilidade: se não existir, usa universe_mode antigo como fallback
  const segmentsRaw = m.get('universe_segments')
    ?? (m.get('universe_mode') === 'full' ? 'acoes_b3,bdr,fii,etf' : 'ibov')
  return {
    zscoreThreshold:  parseFloat(m.get('zscore_threshold') ?? String(env)),
    lookbackWindow:   parseInt(m.get('lookback_window')    ?? '60', 10),
    minScore:         parseInt(m.get('min_score')          ?? '50', 10),
    minHalfLife:      parseFloat(m.get('min_half_life')    ?? '5'),
    maxHalfLife:      parseFloat(m.get('max_half_life')    ?? '60'),
    corrThreshold:    parseFloat(m.get('corr_threshold')   ?? '0.80'),
    capStock:         parseInt(m.get('cap_stock')          ?? '200', 10),
    capFII:           parseInt(m.get('cap_fii')            ?? '100', 10),
    capETF:           parseInt(m.get('cap_etf')            ?? '30',  10),
    capBDR:           parseInt(m.get('cap_bdr')            ?? '50',  10),
    universeSegments: parseSegments(segmentsRaw),
    liquidity: {
      minAdvStock: parseFloat(m.get('min_adv_stock') ?? '5000000'),
      minAdvFII:   parseFloat(m.get('min_adv_fii')   ?? '500000'),
      minAdvETF:   parseFloat(m.get('min_adv_etf')   ?? '50000'),
      minAdvBDR:   parseFloat(m.get('min_adv_bdr')   ?? '2000000'),
    },
  }
}

function capForType(type: AssetType, cfg: ScanConfig): number {
  if (type === 'fii') return cfg.capFII
  if (type === 'etf') return cfg.capETF
  if (type === 'bdr') return cfg.capBDR
  return cfg.capStock
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

export async function runPairScan(triggerType: string): Promise<void> {
  const db = createAdminClient()
  const startedAt = Date.now()

  Object.assign(scanProgress, {
    running: true, phase: 'universe',
    tickersFetched: 0, tickersTotal: 0, pairsTested: 0,
    elapsedMs: 0, startedAt, scanRunId: null,
  })

  // 1. Cria registro do scan
  const { data: runData, error: runError } = await db
    .from('scan_runs')
    .insert({ trigger_type: triggerType, status: 'running' })
    .select('id').single()

  if (runError || !runData) {
    scanProgress.running = false
    throw new Error(`Failed to create scan_run: ${runError?.message}`)
  }

  const scanRunId = runData.id as string
  scanProgress.scanRunId = scanRunId

  try {
    const config = await loadConfig()

    // 2. Monta lista de candidatos
    scanProgress.phase = 'universe'
    const { tickers: candidates, types: tickerTypes } = await getCandidateTickers(config.universeSegments)
    console.log(`[SCAN] segments=[${config.universeSegments.join(',')}]: ${candidates.length} candidates`)

    // 3. Busca histórico 1y — 3 requests paralelos por rodada, 400ms de pausa entre rodadas
    //    BRAPI não aceita múltiplos tickers no endpoint ?range=1y — cada ticker é uma request individual
    scanProgress.phase = 'fetching'
    scanProgress.tickersTotal = candidates.length

    const rawHistories = new Map<string, TickerHistory>()
    const concurrency = 3
    const delayMs = 400

    for (let i = 0; i < candidates.length; i += concurrency) {
      const batch = candidates.slice(i, i + concurrency)
      const fetched = await Promise.all(batch.map(t => fetchHistory(t)))
      for (let j = 0; j < batch.length; j++) {
        const h = fetched[j]
        if (h) rawHistories.set(batch[j], h)
      }
      scanProgress.tickersFetched = Math.min(i + concurrency, candidates.length)
      scanProgress.elapsedMs = Date.now() - startedAt
      if (i + concurrency < candidates.length) {
        await new Promise(r => setTimeout(r, delayMs))
      }
    }

    console.log(`[SCAN] histories fetched: ${rawHistories.size} / ${candidates.length}`)

    // 4. Filtra por liquidez + ordena por ADV + aplica cap por tipo
    //    (ADV calculado a partir do volume das barras históricas — confiável)
    const byType = new Map<AssetType, Array<{ ticker: string; history: TickerHistory; adv: number }>>()

    for (const [ticker, history] of rawHistories) {
      const type = tickerTypes.get(ticker)
      if (!type) continue

      const minAdv = minAdvForType(type, config.liquidity)
      const hasVolume = history.bars.some(b => b.volume != null && b.volume! > 0)
      const adv = hasVolume ? computeADVFromHistory(history.bars) : 0

      // Se não há dados de volume, inclui se for do Ibovespa (fallback conservador)
      const passLiquidity = !hasVolume || adv >= minAdv
      if (!passLiquidity) continue

      if (!byType.has(type)) byType.set(type, [])
      byType.get(type)!.push({ ticker, history, adv })
    }

    // Ordena por ADV desc e aplica cap
    const finalUniverse = new Map<string, { history: TickerHistory; type: AssetType }>()
    for (const [type, entries] of byType) {
      const cap = capForType(type, config)
      const sorted = entries.sort((a, b) => b.adv - a.adv).slice(0, cap)
      console.log(`[SCAN] type=${type}: ${entries.length} passed liquidity, cap=${cap}, using ${sorted.length}`)
      for (const { ticker, history } of sorted) {
        finalUniverse.set(ticker, { history, type })
      }
    }

    const tickersScanned = finalUniverse.size
    console.log(`[SCAN] final universe: ${tickersScanned} tickers`)
    const universeEntries = Array.from(finalUniverse.entries())

    // 5. Gera pares do mesmo tipo + filtro de correlação + ADF
    scanProgress.phase = 'testing'

    interface CointPair {
      ticker_a:      string
      ticker_b:      string
      hedge_ratio:   number
      adf_statistic: number
      p_value:       number
      z_score:       number
      half_life:     number
      score:         number
      signal:        string
      spread_mean:   number
      spread_std:    number
    }

    const cointegratedPairs: CointPair[] = []
    let pairsTested = 0

    for (let i = 0; i < universeEntries.length; i++) {
      const [tickerA, { history: histA, type: typeA }] = universeEntries[i]

      for (let j = i + 1; j < universeEntries.length; j++) {
        const [tickerB, { history: histB, type: typeB }] = universeEntries[j]

        // Somente mesmo tipo
        if (typeA !== typeB) continue

        // Alinhamento pairwise — correto para ativos com datas distintas
        const { pricesA, pricesB } = alignPriceSeries(histA, histB)
        if (pricesA.length < 120) continue

        pairsTested++
        scanProgress.pairsTested = pairsTested
        scanProgress.elapsedMs = Date.now() - startedAt

        // Filtro de correlação (0.80)
        const r = pearsonCorrelation(pricesA, pricesB)
        if (Math.abs(r) < config.corrThreshold) continue

        // Teste ADF
        const result = testCointegration(pricesA, pricesB)
        if (result.pValue >= 0.10) continue

        const zSeries  = computeZScoreSeries(result.residuals, config.lookbackWindow)
        const currentZ = zSeries[zSeries.length - 1]
        const hl       = result.halfLifeDays
        const z        = isFinite(currentZ) ? currentZ : 0

        const score = rankPair({
          pValue:        result.pValue,
          currentZScore: z,
          halfLifeDays:  isFinite(hl) ? hl : 999,
        })

        let signal = 'neutral'
        if (z >  config.zscoreThreshold) signal = 'short_spread'
        if (z < -config.zscoreThreshold) signal = 'long_spread'

        if (result.pValue < 0.05) {
          cointegratedPairs.push({
            ticker_a:      tickerA,
            ticker_b:      tickerB,
            hedge_ratio:   result.hedgeRatio,
            adf_statistic: result.adfStatistic,
            p_value:       result.pValue,
            z_score:       z,
            half_life:     isFinite(hl) ? hl : 9999,
            score,
            signal,
            spread_mean:   result.spreadMean,
            spread_std:    result.spreadStd,
          })
        }
      }
    }

    const pairsFound = cointegratedPairs.length
    console.log(`[SCAN] testing done: ${pairsTested} pairs tested, ${pairsFound} cointegrated (p<0.05)`)

    // 6. Busca preços atuais e salva no banco
    scanProgress.phase = 'saving'
    const tickersNeeded = Array.from(
      new Set(cointegratedPairs.flatMap(p => [p.ticker_a, p.ticker_b]))
    )
    const quotes = await fetchQuotesBatched(tickersNeeded, 10, 300)

    for (const pair of cointegratedPairs) {
      const priceA = quotes.get(pair.ticker_a) ?? null
      const priceB = quotes.get(pair.ticker_b) ?? null

      const { data: pairData } = await db
        .from('cointegrated_pairs')
        .insert({
          scan_run_id:   scanRunId,
          ticker_a:      pair.ticker_a,
          ticker_b:      pair.ticker_b,
          hedge_ratio:   r6(pair.hedge_ratio),
          adf_statistic: r6(pair.adf_statistic),
          p_value:       r6(pair.p_value),
          z_score:       r4(pair.z_score),
          half_life:     r2(pair.half_life),
          score:         pair.score,
          signal:        pair.signal,
          price_a:       priceA ? r4(priceA) : null,
          price_b:       priceB ? r4(priceB) : null,
          spread_mean:   r6(pair.spread_mean),
          spread_std:    r6(pair.spread_std),
          is_active:     true,
        })
        .select('id').single()

    }

    // 7. Finaliza scan_run
    await db.from('scan_runs').update({
      status:          'completed',
      tickers_scanned: tickersScanned,
      pairs_tested:    pairsTested,
      pairs_found:     pairsFound,
      duration_ms:     Date.now() - startedAt,
    }).eq('id', scanRunId)

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await db.from('scan_runs').update({
      status: 'failed', error_message: msg,
      duration_ms: Date.now() - startedAt,
    }).eq('id', scanRunId)
    throw err
  } finally {
    scanProgress.running = false
    scanProgress.phase = 'idle'
    scanProgress.elapsedMs = Date.now() - startedAt
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const r2 = (n: number) => Math.round(n * 100) / 100
const r4 = (n: number) => Math.round(n * 10000) / 10000
const r6 = (n: number) => Math.round(n * 1000000) / 1000000
