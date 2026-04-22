/**
 * PairLens — Pair Reliability Index (PRI)
 *
 * Indicador proprietário para assinantes. Mede a CONFIABILIDADE HISTÓRICA
 * de um par cointegrado além dos indicadores estatísticos padrão (ADF, Z-Score).
 *
 * Este arquivo é autossuficiente — sem imports externos. Pode ser copiado
 * diretamente para qualquer projeto TypeScript/Node.js.
 *
 * ─── COMPONENTES ────────────────────────────────────────────────────────────
 *
 *   HRR — Historical Reversion Rate (40%)
 *     Das vezes que o Z-Score cruzou o threshold no histórico de 1 ano,
 *     quantas % reverteram com sucesso para |z| < 0.5 dentro de 2×half-life dias?
 *     É literalmente o win rate histórico da estratégia neste par específico.
 *
 *   WBA — Weighted Band Adherence (35%)
 *     Porcentagem do tempo que o par ficou dentro do range |z| < 2,
 *     com peso exponencial — dias recentes valem mais.
 *     Mede a estabilidade do relacionamento ao longo do tempo.
 *
 *   SS — Structural Stability (25%)
 *     Compara a correlação de Pearson dos últimos 60 pregões com a do ano inteiro.
 *     Detecta deterioração recente da relação antes que o ADF (que usa a série
 *     toda) consiga capturar — é um alerta precoce de quebra estrutural.
 *
 *   PRI = round((0.40 × HRR + 0.35 × WBA + 0.25 × SS) × 100)
 *
 * ─── DB SCHEMA (migration a adicionar) ─────────────────────────────────────
 *
 *   ALTER TABLE cointegrated_pairs
 *     ADD COLUMN IF NOT EXISTS pri             integer,
 *     ADD COLUMN IF NOT EXISTS hrr             numeric(5,4),
 *     ADD COLUMN IF NOT EXISTS wba             numeric(5,4),
 *     ADD COLUMN IF NOT EXISTS ss              numeric(5,4),
 *     ADD COLUMN IF NOT EXISTS hist_entries    integer,
 *     ADD COLUMN IF NOT EXISTS hist_successes  integer;
 *
 * ─── USO NO SCANNER (lib/scanner.ts) ────────────────────────────────────────
 *
 *   import { computePRI } from './pri'
 *
 *   // Após computar zSeries e result (testCointegration):
 *   const pri = computePRI({
 *     zScores:   zSeries,
 *     halfLife:  result.halfLifeDays,
 *     pricesA,
 *     pricesB,
 *     zThreshold: config.zscoreThreshold,
 *   })
 *
 *   // Adicionar ao insert de cointegrated_pairs:
 *   pri:             pri.pri,
 *   hrr:             r4(pri.hrr),
 *   wba:             r4(pri.wba),
 *   ss:              r4(pri.ss),
 *   hist_entries:    pri.histEntries,
 *   hist_successes:  pri.histSuccesses,
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PRIResult {
  /** Score composto 0–100. Confiabilidade histórica geral do par. */
  pri: number

  /** Historical Reversion Rate — 0.0 a 1.0.
   *  Fração das entradas históricas que reverteram com sucesso.
   *  0.5 indica dados insuficientes (< 3 entradas detectadas). */
  hrr: number

  /** Weighted Band Adherence — 0.0 a 1.0.
   *  Fração ponderada do tempo com |z| < zThreshold. */
  wba: number

  /** Structural Stability — 0.0 a 1.0.
   *  Consistência da correlação recente vs. correlação do período completo. */
  ss: number

  /** Número de eventos de entrada detectados no histórico. */
  histEntries: number

  /** Número de entradas que reverteram com sucesso. */
  histSuccesses: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Função principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula o Pair Reliability Index (PRI) e seus três subcomponentes.
 *
 * @param zScores      Série de z-scores rolling (pode ter NaN no início da janela)
 * @param halfLife     Meia-vida em dias úteis (de computeHalfLife)
 * @param pricesA      Série de preços alinhados do ativo A
 * @param pricesB      Série de preços alinhados do ativo B
 * @param zThreshold   Threshold de sinal (padrão 2.0)
 * @param wbaLambda    Fator de decay do WBA (padrão 0.985 ≈ 50% nos últimos 45 dias)
 * @param recentWindow Janela em dias para o cálculo de SS (padrão 60)
 */
export function computePRI(params: {
  zScores:      number[]
  halfLife:     number
  pricesA:      number[]
  pricesB:      number[]
  zThreshold?:  number
  wbaLambda?:   number
  recentWindow?: number
}): PRIResult {
  const {
    zScores,
    halfLife,
    pricesA,
    pricesB,
    zThreshold  = 2.0,
    wbaLambda   = 0.985,
    recentWindow = 60,
  } = params

  const { hrr, histEntries: entries, histSuccesses: successes } =
    _computeHRR(zScores, halfLife, zThreshold)

  const wba = _computeWBA(zScores, zThreshold, wbaLambda)
  const ss  = _computeSS(pricesA, pricesB, recentWindow)

  const raw = 0.40 * hrr + 0.35 * wba + 0.25 * ss
  const pri = Math.round(raw * 100)

  return { pri, hrr, wba, ss, histEntries: entries, histSuccesses: successes }
}

// ─────────────────────────────────────────────────────────────────────────────
// HRR — Historical Reversion Rate
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Varre a série de z-scores e detecta cada "evento de entrada":
 * momento em que |z| cruza o threshold vindo de baixo.
 *
 * Para cada entrada, verifica se |z| retornou para < 0.5
 * dentro de (2 × halfLife) dias → sucesso.
 *
 * Depois de detectar uma entrada, avança o índice até o fim da
 * excursão (|z| volta abaixo do threshold) para não contar
 * re-entradas dentro do mesmo episódio.
 *
 * Mínimo de 3 entradas para valor confiável;
 * abaixo disso retorna 0.5 (neutro — dados insuficientes).
 */
function _computeHRR(
  zScores:    number[],
  halfLife:   number,
  zThreshold: number,
): { hrr: number; histEntries: number; histSuccesses: number } {
  const safeHL         = isFinite(halfLife) && halfLife > 0 ? halfLife : 10
  const maxLookforward = Math.max(Math.round(2 * safeHL), 10)

  let entries   = 0
  let successes = 0

  // Avança até o primeiro z-score válido (pula NaN da janela rolling)
  let i = 0
  while (i < zScores.length && !isFinite(zScores[i])) i++
  if (i >= zScores.length) return { hrr: 0.5, histEntries: 0, histSuccesses: 0 }

  let prevAbsZ = Math.abs(zScores[i])
  i++

  while (i < zScores.length) {
    const z = zScores[i]
    if (!isFinite(z)) { i++; continue }
    const absZ = Math.abs(z)

    // Crossing: |z| subiu do abaixo para acima do threshold
    if (absZ >= zThreshold && prevAbsZ < zThreshold) {
      entries++

      // Verifica reversão: |z| < 0.5 em até maxLookforward passos
      let reverted = false
      const horizon = Math.min(i + 1 + maxLookforward, zScores.length)
      for (let j = i + 1; j < horizon; j++) {
        if (isFinite(zScores[j]) && Math.abs(zScores[j]) < 0.5) {
          reverted = true
          break
        }
      }
      if (reverted) successes++

      // Avança até o fim da excursão (|z| cai abaixo do threshold)
      // para não contar múltiplas entradas no mesmo episódio
      while (i < zScores.length) {
        const cz = zScores[i]
        if (isFinite(cz) && Math.abs(cz) < zThreshold) break
        i++
      }

      prevAbsZ = i < zScores.length && isFinite(zScores[i])
        ? Math.abs(zScores[i])
        : 0
      continue
    }

    prevAbsZ = absZ
    i++
  }

  if (entries < 3) {
    return { hrr: 0.5, histEntries: entries, histSuccesses: successes }
  }

  return {
    hrr:            successes / entries,
    histEntries:    entries,
    histSuccesses:  successes,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WBA — Weighted Band Adherence
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Porcentagem ponderada do tempo que o z-score ficou dentro de |z| < zThreshold.
 * Peso exponencial: dia mais recente vale mais.
 *
 * lambda = 0.985 → os últimos ~45 pregões respondem por ~50% do peso total,
 * mas o histórico completo ainda influencia o resultado.
 *
 * WBA = Σ(lambda^(T-1-i) × 1_{|z_i| < threshold}) / Σ(lambda^(T-1-i))
 */
function _computeWBA(
  zScores:    number[],
  zThreshold: number,
  lambda:     number,
): number {
  let weightedIn = 0
  let weightTotal = 0
  const n = zScores.length

  for (let i = 0; i < n; i++) {
    const z = zScores[i]
    if (!isFinite(z)) continue

    const w = Math.pow(lambda, n - 1 - i)
    weightTotal += w
    if (Math.abs(z) < zThreshold) {
      weightedIn += w
    }
  }

  return weightTotal > 0 ? weightedIn / weightTotal : 0
}

// ─────────────────────────────────────────────────────────────────────────────
// SS — Structural Stability
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mede se a correlação recente está se sustentando ou se deteriorando.
 *
 * Compara:
 *   corrFull   = Pearson(pricesA, pricesB)          — período completo (1 ano)
 *   corrRecent = Pearson(pricesA[-window:], pricesB[-window:]) — janela recente
 *
 * SS = 1 - |corrRecent - corrFull| / |corrFull|
 *      clamped to [0, 1]
 *
 * SS próximo de 1.0 → correlação estável (relação estrutural).
 * SS abaixo de 0.70 → deterioração significativa — sinal de alerta.
 */
function _computeSS(
  pricesA:      number[],
  pricesB:      number[],
  recentWindow: number,
): number {
  if (pricesA.length < recentWindow + 10 || pricesB.length < recentWindow + 10) {
    return 0.5 // dados insuficientes
  }

  const corrFull   = _pearson(pricesA, pricesB)
  const recentA    = pricesA.slice(-recentWindow)
  const recentB    = pricesB.slice(-recentWindow)
  const corrRecent = _pearson(recentA, recentB)

  if (corrFull === 0) return 0

  const ss = 1 - Math.abs(corrRecent - corrFull) / Math.abs(corrFull)
  return Math.max(0, Math.min(1, ss))
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Pearson correlation (inline — sem imports)
// ─────────────────────────────────────────────────────────────────────────────

function _pearson(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length)
  if (n < 2) return 0

  let sumA = 0, sumB = 0
  for (let i = 0; i < n; i++) { sumA += a[i]; sumB += b[i] }
  const ma = sumA / n
  const mb = sumB / n

  let num = 0, da2 = 0, db2 = 0
  for (let i = 0; i < n; i++) {
    const da = a[i] - ma
    const db = b[i] - mb
    num += da * db
    da2 += da * da
    db2 += db * db
  }

  const den = Math.sqrt(da2 * db2)
  return den === 0 ? 0 : num / den
}
