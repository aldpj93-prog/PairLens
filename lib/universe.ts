/**
 * PairLens — Asset universe builder
 *
 * Segments disponíveis:
 *   ibov      → 85 tickers do Ibovespa (type=stock)
 *   acoes_b3  → todas as ações listadas na B3 (type=stock)
 *   bdr       → BDRs negociados na B3 (type=bdr)
 *   fii       → Fundos Imobiliários (type=fii)
 *   etf       → ETFs listados na B3 (type=etf)
 *
 * Múltiplos segmentos podem ser combinados (multi-select).
 * Filtro de liquidez é aplicado DEPOIS de buscar o histórico.
 */

import { fetchTickerList, classifyTicker, type AssetType } from './brapi'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type UniverseSegment = 'ibov' | 'acoes_b3' | 'bdr' | 'fii' | 'etf'

export const UNIVERSE_SEGMENT_OPTIONS: Array<{
  key:         UniverseSegment
  label:       string
  description: string
}> = [
  { key: 'ibov',    label: 'Ibovespa', description: '85 ações que compõem o índice Ibovespa (~15s)' },
  { key: 'acoes_b3',label: 'Ações B3', description: 'Todas as ações listadas na B3 (~4min)'         },
  { key: 'bdr',     label: 'BDR',      description: 'Recibos de Depósito Brasileiros listados na B3' },
  { key: 'fii',     label: 'FII',      description: 'Fundos de Investimento Imobiliário'             },
  { key: 'etf',     label: 'ETF',      description: 'Fundos de índice (Exchange Traded Funds)'       },
]

// ─────────────────────────────────────────────────────────────────────────────
// Ibovespa — fallback estático (atualizado manualmente quando há rebalanceamento)
// ─────────────────────────────────────────────────────────────────────────────

export const IBOV_TICKERS: string[] = [
  "ABEV3","ASAI3","AZUL4","B3SA3","BBAS3","BBDC3","BBDC4","BBSE3",
  "BEEF3","BPAC11","BRAP4","BRFS3","BRKM5","CCRO3","CIEL3",
  "CMIG4","CMIN3","COGN3","CPFE3","CPLE6","CRFB3","CSAN3","CSNA3",
  "CVCB3","CYRE3","DXCO3","ECOR3","EGIE3","ELEA3","EMBR3","ENEV3",
  "ENGI11","EQTL3","EZTC3","FLRY3","GGBR4","GOAU4","GOLL4","HAPV3",
  "HYPE3","IGTI11","IRBR3","ITSA4","ITUB4","JBSS3","JHSF3","KLBN11",
  "LREN3","LWSA3","MGLU3","MRFG3","MRVE3","MULT3","NTCO3","PCAR3",
  "PETR3","PETR4","PETZ3","POSI3","PRIO3","QUAL3","RADL3","RAIL3",
  "RAIZ4","RDOR3","RENT3","RRRP3","SANB11","SBSP3","SLCE3","SMTO3",
  "SOMA3","SUZB3","TAEE11","TIMS3","TOTS3","UGPA3","USIM5","VALE3",
  "VBBR3","VIIA3","VIVT3","WEGE3","YDUQ3",
]

// ─────────────────────────────────────────────────────────────────────────────
// Liquidity config
// ─────────────────────────────────────────────────────────────────────────────

export interface LiquidityConfig {
  minAdvStock: number   // R$/dia para Ações  (default 5_000_000)
  minAdvFII:   number   // R$/dia para FIIs   (default   500_000)
  minAdvETF:   number   // R$/dia para ETFs   (default    50_000)
  minAdvBDR:   number   // R$/dia para BDRs   (default 2_000_000)
}

export const DEFAULT_LIQUIDITY: LiquidityConfig = {
  minAdvStock: 5_000_000,
  minAdvFII:     500_000,
  minAdvETF:      50_000,
  minAdvBDR:   2_000_000,
}

export function minAdvForType(type: AssetType, cfg: LiquidityConfig): number {
  if (type === 'fii') return cfg.minAdvFII
  if (type === 'etf') return cfg.minAdvETF
  if (type === 'bdr') return cfg.minAdvBDR
  return cfg.minAdvStock
}

// ─────────────────────────────────────────────────────────────────────────────
// Build candidate ticker list (sem filtro de liquidez — feito após fetch)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retorna a lista de tickers candidatos para o scan de acordo com
 * os segmentos selecionados pelo usuário.
 *
 * Segmentos podem ser combinados: ex. ['ibov', 'fii'] escaneia
 * ações do Ibovespa + todos os FIIs.
 *
 * Quando 'acoes_b3' e 'ibov' estão ambos selecionados, 'acoes_b3'
 * é um superconjunto — os tickers do Ibovespa já estão incluídos.
 */
export async function getCandidateTickers(segments: UniverseSegment[] = ['ibov']): Promise<{
  tickers: string[]
  types:   Map<string, AssetType>
}> {
  const types = new Map<string, AssetType>()

  // Precisa buscar a lista BRAPI para qualquer segmento além do ibov
  const needsBrapiList = segments.some(s => s !== 'ibov')
  let brapiList: Array<{ ticker: string }> = []

  if (needsBrapiList) {
    try {
      brapiList = await fetchTickerList()
    } catch {
      // Lista BRAPI indisponível — continua com o que foi carregado até aqui
    }
  }

  // ── Ibovespa ───────────────────────────────────────────────────────────────
  if (segments.includes('ibov') && !segments.includes('acoes_b3')) {
    // Somente os tickers do índice (não a B3 inteira)
    for (const t of IBOV_TICKERS) {
      const type = classifyTicker(t)
      if (type === 'stock') types.set(t, 'stock')
    }
  }

  // ── Ações B3 (superconjunto do Ibovespa) ──────────────────────────────────
  if (segments.includes('acoes_b3')) {
    // Inclui Ibovespa primeiro para garantir presença mesmo se BRAPI falhar
    for (const t of IBOV_TICKERS) {
      const type = classifyTicker(t)
      if (type === 'stock') types.set(t, 'stock')
    }
    // Adiciona o restante da lista BRAPI
    for (const { ticker } of brapiList) {
      const type = classifyTicker(ticker)
      if (type === 'stock') types.set(ticker, 'stock')
    }
  }

  // ── BDR ───────────────────────────────────────────────────────────────────
  if (segments.includes('bdr')) {
    for (const { ticker } of brapiList) {
      const type = classifyTicker(ticker)
      if (type === 'bdr') types.set(ticker, 'bdr')
    }
  }

  // ── FII ───────────────────────────────────────────────────────────────────
  if (segments.includes('fii')) {
    for (const { ticker } of brapiList) {
      const type = classifyTicker(ticker)
      if (type === 'fii') types.set(ticker, 'fii')
    }
  }

  // ── ETF ───────────────────────────────────────────────────────────────────
  if (segments.includes('etf')) {
    for (const { ticker } of brapiList) {
      const type = classifyTicker(ticker)
      if (type === 'etf') types.set(ticker, 'etf')
    }
  }

  const tickers = Array.from(types.keys()).sort()
  return { tickers, types }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Parseia a string do banco (ex: "ibov,fii") para um array de segmentos válidos. */
export function parseSegments(raw: string): UniverseSegment[] {
  const valid = new Set<string>(['ibov', 'acoes_b3', 'bdr', 'fii', 'etf'])
  const parsed = raw
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(s => valid.has(s)) as UniverseSegment[]
  return parsed.length > 0 ? parsed : ['ibov']
}
