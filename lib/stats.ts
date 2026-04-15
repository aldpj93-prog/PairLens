/**
 * PairLens — Statistical Engine
 * Pure TypeScript implementation. No external stats libraries.
 *
 * Implements:
 *   - OLS linear regression
 *   - Augmented Dickey-Fuller (ADF) test
 *   - Engle-Granger cointegration test (CADF)
 *   - Rolling z-score series
 *   - Half-life from AR(1)
 *   - Pair composite scoring
 *
 * Known limitation: ADF p-value is approximated via MacKinnon (1994) response
 * surface interpolation between the 1%, 5%, and 10% critical values. This is
 * adequate for screening but should not be used as an exact inference engine.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. OLS LINEAR REGRESSION
// ─────────────────────────────────────────────────────────────────────────────

export interface OLSResult {
  alpha: number
  beta: number
  residuals: number[]
}

/**
 * Ordinary Least Squares: y = alpha + beta * x
 * beta  = Σ((x - x̄)(y - ȳ)) / Σ((x - x̄)²)
 * alpha = ȳ - beta * x̄
 */
export function olsRegression(y: number[], x: number[]): OLSResult {
  const n = y.length
  if (n !== x.length || n < 2) {
    throw new Error(`olsRegression: length mismatch or insufficient data (n=${n})`)
  }

  let sumX = 0
  let sumY = 0
  for (let i = 0; i < n; i++) {
    sumX += x[i]
    sumY += y[i]
  }
  const meanX = sumX / n
  const meanY = sumY / n

  let num = 0
  let den = 0
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX
    num += dx * (y[i] - meanY)
    den += dx * dx
  }

  if (den === 0) {
    throw new Error('olsRegression: zero variance in x')
  }

  const beta = num / den
  const alpha = meanY - beta * meanX
  const residuals = y.map((yi, i) => yi - alpha - beta * x[i])

  return { alpha, beta, residuals }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. MATRIX UTILITIES (for ADF multi-variate OLS)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Transpose a matrix (rows × cols → cols × rows)
 */
function transpose(A: number[][]): number[][] {
  const rows = A.length
  const cols = A[0].length
  const T: number[][] = Array.from({ length: cols }, () => new Array(rows).fill(0))
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      T[j][i] = A[i][j]
    }
  }
  return T
}

/**
 * Matrix multiplication: (m×k) × (k×n) → (m×n)
 */
function matMul(A: number[][], B: number[][]): number[][] {
  const m = A.length
  const k = A[0].length
  const n = B[0].length
  const C: number[][] = Array.from({ length: m }, () => new Array(n).fill(0))
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      let s = 0
      for (let l = 0; l < k; l++) s += A[i][l] * B[l][j]
      C[i][j] = s
    }
  }
  return C
}

/**
 * Matrix × vector product
 */
function matVec(A: number[][], v: number[]): number[] {
  return A.map(row => row.reduce((s, a, j) => s + a * v[j], 0))
}

/**
 * Cholesky decomposition + forward/back substitution for (X'X)^{-1} diagonal.
 * Returns full inverse via Cholesky solve for each unit vector.
 * Falls back to a Gauss-Jordan inverse if Cholesky fails.
 */
function invertSymmetric(A: number[][]): number[][] {
  const n = A.length
  // Cholesky: A = L L'
  const L: number[][] = Array.from({ length: n }, () => new Array(n).fill(0))
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let s = A[i][j]
      for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k]
      if (i === j) {
        if (s <= 0) return gaussJordanInverse(A) // fallback
        L[i][j] = Math.sqrt(s)
      } else {
        L[i][j] = s / L[j][j]
      }
    }
  }
  // Solve L L' inv_col = e_j for each column j
  const inv: number[][] = Array.from({ length: n }, () => new Array(n).fill(0))
  for (let j = 0; j < n; j++) {
    const e = new Array(n).fill(0)
    e[j] = 1
    // Forward substitution: L y = e
    const y = new Array(n).fill(0)
    for (let i = 0; i < n; i++) {
      let s = e[i]
      for (let k = 0; k < i; k++) s -= L[i][k] * y[k]
      y[i] = s / L[i][i]
    }
    // Back substitution: L' x = y
    const x = new Array(n).fill(0)
    for (let i = n - 1; i >= 0; i--) {
      let s = y[i]
      for (let k = i + 1; k < n; k++) s -= L[k][i] * x[k]
      x[i] = s / L[i][i]
    }
    for (let i = 0; i < n; i++) inv[i][j] = x[i]
  }
  return inv
}

function gaussJordanInverse(A: number[][]): number[][] {
  const n = A.length
  // Augmented matrix [A | I]
  const M: number[][] = A.map((row, i) => {
    const aug = [...row, ...new Array(n).fill(0)]
    aug[n + i] = 1
    return aug
  })
  for (let col = 0; col < n; col++) {
    // Pivot
    let maxRow = col
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[maxRow][col])) maxRow = r
    }
    ;[M[col], M[maxRow]] = [M[maxRow], M[col]]
    const pivot = M[col][col]
    if (Math.abs(pivot) < 1e-14) throw new Error('Singular matrix in gaussJordanInverse')
    for (let j = 0; j < 2 * n; j++) M[col][j] /= pivot
    for (let r = 0; r < n; r++) {
      if (r === col) continue
      const factor = M[r][col]
      for (let j = 0; j < 2 * n; j++) M[r][j] -= factor * M[col][j]
    }
  }
  return M.map(row => row.slice(n))
}

/**
 * Multivariate OLS: solve β = (X'X)^{-1} X'y
 * Returns coefficients and the diagonal of (X'X)^{-1} scaled by σ²
 */
interface MultiOLSResult {
  coefficients: number[]
  residuals: number[]
  sigma2: number
  xtxInv: number[][]
}

function multiOLS(y: number[], X: number[][]): MultiOLSResult {
  const n = X.length
  const p = X[0].length
  const Xt = transpose(X)
  const XtX = matMul(Xt, X)
  const XtXinv = invertSymmetric(XtX)
  const Xty = matVec(Xt, y)
  const coef = matVec(XtXinv, Xty)
  const fitted = X.map(row => row.reduce((s, v, j) => s + v * coef[j], 0))
  const residuals = y.map((yi, i) => yi - fitted[i])
  const sse = residuals.reduce((s, e) => s + e * e, 0)
  const sigma2 = sse / (n - p)
  return { coefficients: coef, residuals, sigma2, xtxInv: XtXinv }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ADF TEST
// ─────────────────────────────────────────────────────────────────────────────

export interface ADFResult {
  statistic: number
  pValue: number
  usedLag: number
}

/**
 * MacKinnon (1994) response surface critical values for ADF with constant.
 * CV(p) = tau_inf + beta1/n + beta2/n²
 */
function adfCriticalValue(n: number, level: '1%' | '5%' | '10%'): number {
  const tables: Record<string, [number, number, number]> = {
    '1%':  [-3.4336, -5.999, -29.25],
    '5%':  [-2.8621, -2.738,  -8.36],
    '10%': [-2.5671, -1.438,  -4.48],
  }
  const [tau, b1, b2] = tables[level]
  return tau + b1 / n + b2 / (n * n)
}

/**
 * Approximate p-value via linear interpolation between MacKinnon critical values.
 *
 * Known limitation: this is a piecewise linear approximation adequate for
 * screening. Exact inference requires MacKinnon's full response surface tables
 * or numerical distribution of the Dickey-Fuller statistic.
 */
function adfPValue(t: number, n: number): number {
  const cv1  = adfCriticalValue(n, '1%')
  const cv5  = adfCriticalValue(n, '5%')
  const cv10 = adfCriticalValue(n, '10%')

  if (t <= cv1)  return 0.001
  if (t >= cv10) return 0.500
  if (t <= cv5)  return 0.01 + 0.04 * (t - cv1) / (cv5 - cv1)
  // between cv5 and cv10
  return 0.05 + 0.05 * (t - cv5) / (cv10 - cv5)
}

/**
 * AIC for lag selection in ADF
 */
function computeAIC(sse: number, n: number, k: number): number {
  return n * Math.log(sse / n) + 2 * k
}

/**
 * Augmented Dickey-Fuller test.
 * Model: Δy_t = α + γ*y_{t-1} + Σβ_k*Δy_{t-k} + ε_t
 *
 * Uses AIC to select optimal lag up to maxLag.
 * Returns t-statistic on γ and approximate p-value.
 */
export function adfTest(series: number[], maxLag?: number): ADFResult {
  const n = series.length
  const defaultMaxLag = Math.floor(4 * Math.pow(n / 100, 0.25))
  const lagMax = maxLag ?? defaultMaxLag

  // First differences
  const dy: number[] = []
  for (let i = 1; i < n; i++) dy.push(series[i] - series[i - 1])

  let bestLag = 0
  let bestAIC = Infinity
  let bestResult: MultiOLSResult | null = null

  for (let lag = 0; lag <= lagMax; lag++) {
    // We need lag+1 observations of lagged level and lag observations of diff lags
    const start = lag + 1 // index into dy[]
    if (start >= dy.length - 2) continue

    const T = dy.length - start
    const y = dy.slice(start)
    // Columns: [1 (intercept), y_{t-1} (lagged level), Δy_{t-1}, ..., Δy_{t-lag}]
    const X: number[][] = []
    for (let t = start; t < dy.length; t++) {
      const row: number[] = [1, series[t - 1]] // intercept + lagged level
      for (let k = 1; k <= lag; k++) {
        row.push(dy[t - k]) // lagged differences
      }
      X.push(row)
    }

    const result = multiOLS(y, X)
    const sse = result.residuals.reduce((s, e) => s + e * e, 0)
    const aic = computeAIC(sse, T, 2 + lag)

    if (aic < bestAIC) {
      bestAIC = aic
      bestLag = lag
      bestResult = result
    }
  }

  if (!bestResult) {
    return { statistic: 0, pValue: 1, usedLag: 0 }
  }

  // gamma is at index 1 (after intercept)
  const gamma = bestResult.coefficients[1]
  const se = Math.sqrt(bestResult.sigma2 * bestResult.xtxInv[1][1])
  const tStat = se > 0 ? gamma / se : 0

  const effectiveN = series.length - bestLag - 1
  const pValue = adfPValue(tStat, effectiveN)

  return { statistic: tStat, pValue, usedLag: bestLag }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. COINTEGRATION TEST (Engle-Granger CADF)
// ─────────────────────────────────────────────────────────────────────────────

export interface CointegrationResult {
  hedgeRatio: number
  alpha: number
  residuals: number[]
  adfStatistic: number
  pValue: number
  isCointegrated: boolean
  spreadMean: number
  spreadStd: number
  currentZScore: number
  halfLifeDays: number
}

/**
 * Engle-Granger two-step cointegration test.
 * Tests both A ~ B and B ~ A, returns the direction with the lower ADF statistic.
 *
 * Normalisation: output is always expressed from A's perspective.
 * If the BA direction is stronger, we negate the residuals and currentZScore
 * so that z > 0 always means "A is expensive relative to B" and z < 0 means
 * "A is cheap relative to B", keeping signal logic consistent downstream.
 */
export function testCointegration(
  priceA: number[],
  priceB: number[]
): CointegrationResult {
  const resultAB = _cadf(priceA, priceB)
  const resultBA = _cadf(priceB, priceA)

  if (resultAB.adfStatistic <= resultBA.adfStatistic) {
    return resultAB
  }

  // BA direction chosen: negate residuals and z-score so they are
  // always in A's frame of reference (positive z = A overpriced vs B)
  return {
    ...resultBA,
    currentZScore: -resultBA.currentZScore,
    residuals:     resultBA.residuals.map(r => -r),
  }
}

function _cadf(y: number[], x: number[]): CointegrationResult {
  const { alpha, beta: hedgeRatio, residuals } = olsRegression(y, x)
  const { statistic: adfStatistic, pValue } = adfTest(residuals)

  const n = residuals.length
  let sumR = 0
  for (const r of residuals) sumR += r
  const spreadMean = sumR / n

  let sumSq = 0
  for (const r of residuals) sumSq += (r - spreadMean) ** 2
  const spreadStd = Math.sqrt(sumSq / n)

  const currentZScore = spreadStd > 0
    ? (residuals[n - 1] - spreadMean) / spreadStd
    : 0

  const halfLifeDays = computeHalfLife(residuals)

  return {
    hedgeRatio,
    alpha,
    residuals,
    adfStatistic,
    pValue,
    isCointegrated: pValue < 0.05,
    spreadMean,
    spreadStd,
    currentZScore,
    halfLifeDays,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. ROLLING Z-SCORE SERIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute rolling z-score over a sliding window.
 * Returns NaN for positions before window-1.
 */
export function computeZScoreSeries(residuals: number[], window = 60): number[] {
  const n = residuals.length
  const result = new Array(n).fill(NaN)
  for (let i = window - 1; i < n; i++) {
    let sum = 0
    for (let j = i - window + 1; j <= i; j++) sum += residuals[j]
    const mean = sum / window
    let sq = 0
    for (let j = i - window + 1; j <= i; j++) sq += (residuals[j] - mean) ** 2
    const std = Math.sqrt(sq / window)
    result[i] = std > 0 ? (residuals[i] - mean) / std : 0
  }
  return result
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. HALF-LIFE FROM AR(1)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Estimate mean-reversion half-life via AR(1) regression on first differences.
 * Model: Δspread_t = phi * spread_{t-1} + ε
 * halfLife = -ln(2) / ln(1 + phi)
 *
 * Returns Infinity if phi >= 0 (not mean-reverting).
 */
export function computeHalfLife(spread: number[]): number {
  const n = spread.length
  if (n < 4) return Infinity

  const dy: number[] = []
  const lagged: number[] = []
  for (let i = 1; i < n; i++) {
    dy.push(spread[i] - spread[i - 1])
    lagged.push(spread[i - 1])
  }

  let sumX = 0
  let sumY = 0
  for (let i = 0; i < dy.length; i++) {
    sumX += lagged[i]
    sumY += dy[i]
  }
  const mx = sumX / dy.length
  const my = sumY / dy.length

  let num = 0
  let den = 0
  for (let i = 0; i < dy.length; i++) {
    const dx = lagged[i] - mx
    num += dx * (dy[i] - my)
    den += dx * dx
  }

  if (den === 0) return Infinity
  const phi = num / den

  if (phi >= 0) return Infinity
  return -Math.LN2 / Math.log(1 + phi)
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. PAIR SCORING
// ─────────────────────────────────────────────────────────────────────────────

export interface PairScoreInput {
  pValue: number
  currentZScore: number
  halfLifeDays: number
}

/**
 * Composite pair quality score (0–100).
 *
 * Weights:
 *   - ADF strength (p-value):     30%
 *   - Z-score magnitude:          40%  (|Z| normalized to 3.0 max)
 *   - Half-life quality:          30%  (optimal 5–30 days)
 */
export function rankPair(input: PairScoreInput): number {
  const { pValue, currentZScore, halfLifeDays } = input

  // ADF component: maps p=0 → 1, p=0.05 → 0
  const adfScore = Math.max(0, Math.min(1, (0.05 - pValue) / 0.05))

  // Z-score component: |Z| / 3.0, capped at 1
  const zScore = Math.min(1, Math.abs(currentZScore) / 3.0)

  // Half-life component: optimal band is 5–30 days
  let hlScore: number
  if (!isFinite(halfLifeDays) || halfLifeDays <= 0) {
    hlScore = 0
  } else if (halfLifeDays >= 5 && halfLifeDays <= 30) {
    hlScore = 1
  } else if (halfLifeDays < 5) {
    hlScore = halfLifeDays / 5
  } else {
    // decay from 30 to 60 days
    hlScore = Math.max(0, 1 - (halfLifeDays - 30) / 30)
  }

  const raw = 0.30 * adfScore + 0.40 * zScore + 0.30 * hlScore
  return Math.round(raw * 100)
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. PEARSON CORRELATION (for pre-filter)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fast Pearson correlation coefficient.
 */
export function pearsonCorrelation(a: number[], b: number[]): number {
  const n = a.length
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
