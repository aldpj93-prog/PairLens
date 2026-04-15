/**
 * PairLens — BRAPI API Client
 *
 * Endpoints:
 *   Historical:  GET /quote/{ticker}?range=1y&interval=1d&token=...
 *   Quote:       GET /quote/{ticker}?token=...
 *   Ticker list: GET /quote/list?token=...
 *
 * Rate limit handling: 3 retries with exponential back-off (1s, 2s, 4s)
 */

const BRAPI_BASE = 'https://brapi.dev/api'
const TOKEN = process.env.BRAPI_TOKEN ?? 'wmpzMXRG97E5VveAb8rGzH'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface DailyBar {
  date: string   // ISO date string "YYYY-MM-DD"
  close: number
  volume?: number // shares traded that day
}

export interface TickerHistory {
  ticker: string
  bars: DailyBar[]
}

export interface TickerQuote {
  ticker: string
  price: number
}

export type AssetType = 'stock' | 'fii' | 'etf' | 'bdr'

export interface TickerInfo {
  ticker: string
  name: string
  type: AssetType
  /** Average daily volume in BRL (price × averageDailyVolume3Month) */
  advBRL: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Known ETFs on B3 (stable set — updated manually when new ETFs are listed)
// Source: B3 ETF list. FIIs that superficially look like ETFs are excluded.
// ─────────────────────────────────────────────────────────────────────────────

const B3_ETFS = new Set([
  'BOVA11','SMAL11','IVVB11','HASH11','GOLD11','SPXI11','NTNB11','FIXA11',
  'DIVO11','MATB11','BBSD11','FIND11','GOVE11','ISUS11','PIBB11','TRIG11',
  'XFIX11','XBOV11','ECOO11','NASD11','ACWI11','AGRI11','ASIA11','BDIV11',
  'BGOV11','BITS11','BOVB11','BOVS11','BTAL11','CDBR11','CORP11','CRPT11',
  'CSMO11','DEFI11','DMMO11','DOLAR11','ESGE11','EURP11','FLRP11','GOLD11',
  'GOVB11','GRND11','HGRE11','IFIX11','IFRA11','IMAB11','LEVE11','LIQU11',
  'LQDB11','MALH11','META11','NFTS11','NINF11','NVDC11','PACB11','PORD11',
  'QBTC11','QUAL11','REIT11','RENB11','SMAC11','SMLL11','SOLB11','SPAB11',
  'SPUS11','TECK11','TEQB11','URNG11','USDB11','USDT11','USTB11','UTIP11',
  'VALE3B11','VIXB11','WRLD11','XINA11','XPAC11',
])

// ─────────────────────────────────────────────────────────────────────────────
// Ticker classification heuristics
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Classify a B3 ticker as stock, FII, or ETF.
 *
 * Rules:
 * - Known ETF list → 'etf'
 * - Ends in 11 (and not ETF) → 'fii'
 * - Ends in 3,4,5,6,7,8 → 'stock'
 * - BDR suffixes (31-39, F) → excluded upstream (returns null)
 */
export function classifyTicker(ticker: string): AssetType | null {
  const t = ticker.toUpperCase().trim()

  // Explicit ETF list takes priority
  if (B3_ETFS.has(t)) return 'etf'

  // BDRs: end in 31–39 (Level I, II, III sponsored/unsponsored)
  const suffix = t.replace(/^[A-Z]+/, '')
  if (['31','32','33','34','35','36','37','38','39'].includes(suffix)) return 'bdr'

  // Subscription receipts with F suffix — skip (illiquid)
  if (/\d{1,2}[F]$/.test(t)) return null

  // Units ending in 11 not in ETF list → FII
  if (t.endsWith('11')) return 'fii'

  // Standard equity suffixes (ON=3, PN=4, PNA=5, PNB=6, etc.)
  if (/[3456789]$/.test(t)) return 'stock'
  if (t.endsWith('12')) return 'stock' // subscription receipts

  return null // unknown — skip
}

// ─────────────────────────────────────────────────────────────────────────────
// Fetch all available tickers from BRAPI + their ADV
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch the full list of tickers available on BRAPI.
 * BRAPI /quote/list returns name + last volume in BRL.
 * We use that volume as a rough pre-filter before the detailed fetch.
 */
export async function fetchTickerList(): Promise<Array<{ ticker: string; name: string }>> {
  const url = `${BRAPI_BASE}/quote/list?token=${TOKEN}&limit=2000`
  try {
    const res = await fetchWithRetry(url)
    if (!res.ok) return []
    const data = await res.json()
    const stocks: Array<{ stock: string; name: string }> = data?.stocks ?? []
    return stocks
      .filter(s => s.stock && typeof s.stock === 'string')
      .map(s => ({ ticker: s.stock.toUpperCase(), name: s.name ?? '' }))
  } catch {
    return []
  }
}

/**
 * Batch-fetch ADV (average daily volume in BRL) for a list of tickers.
 * Uses the standard quote endpoint which returns averageDailyVolume3Month.
 * ADV_BRL = averageDailyVolume3Month (shares) × regularMarketPrice
 */
export async function fetchADVBatched(
  tickers: string[],
  batchSize = 10,
  delayMs = 300
): Promise<Map<string, TickerInfo>> {
  const results = new Map<string, TickerInfo>()

  for (let i = 0; i < tickers.length; i += batchSize) {
    const batch = tickers.slice(i, i + batchSize)
    const joined = batch.map(encodeURIComponent).join(',')
    const url = `${BRAPI_BASE}/quote/${joined}?token=${TOKEN}`

    try {
      const res = await fetchWithRetry(url)
      if (res.ok) {
        const data = await res.json()
        const apiResults: Array<{
          symbol: string
          shortName?: string
          longName?: string
          regularMarketPrice?: number
          averageDailyVolume3Month?: number
          averageDailyVolume10Day?: number
          regularMarketVolume?: number
        }> = data?.results ?? []

        for (const r of apiResults) {
          const ticker = (r.symbol ?? '').toUpperCase()
          if (!ticker) continue

          const assetType = classifyTicker(ticker)
          if (!assetType) continue

          const price  = r.regularMarketPrice ?? 0
          const vol3m  = r.averageDailyVolume3Month ?? r.averageDailyVolume10Day ?? r.regularMarketVolume ?? 0
          const advBRL = price * vol3m

          results.set(ticker, {
            ticker,
            name: r.shortName ?? r.longName ?? ticker,
            type: assetType,
            advBRL,
          })
        }
      }
    } catch {
      // Skip failed batch — don't abort entire universe build
    }

    if (i + batchSize < tickers.length) await sleep(delayMs)
  }

  return results
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal fetch with retry + exponential back-off
// ─────────────────────────────────────────────────────────────────────────────

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  const delays = [1000, 2000, 4000]
  for (let attempt = 0; attempt <= retries; attempt++) {
    // Use Node.js native https to bypass Next.js fetch interception
    const response = await fetch(url, {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore — Next.js extended fetch option
      cache: 'no-store',
      next: { revalidate: 0 },
    })
    if (response.status === 429 && attempt < retries) {
      await sleep(delays[attempt] ?? 4000)
      continue
    }
    return response
  }
  throw new Error(`fetchWithRetry: exceeded retries for ${url}`)
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ─────────────────────────────────────────────────────────────────────────────
// Historical prices via Yahoo Finance (1-year daily)
// BRAPI plano gratuito não suporta range=1y — usamos Yahoo Finance (sem chave)
// ─────────────────────────────────────────────────────────────────────────────

const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart'

/**
 * Fetch 1-year daily OHLCV history for a single B3 ticker via Yahoo Finance.
 * Tickers B3 no Yahoo têm sufixo ".SA" (ex: VALE3 → VALE3.SA).
 * Returns null on any error or if fewer than minPoints bars are returned.
 */
export async function fetchHistory(
  ticker: string,
  minPoints = 120
): Promise<TickerHistory | null> {
  const symbol = `${ticker}.SA`
  const url = `${YAHOO_BASE}/${encodeURIComponent(symbol)}?interval=1d&range=1y`
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      console.warn(`[YF] ${ticker}: HTTP ${res.status}`)
      return null
    }

    const data = await res.json()
    const chart = data?.chart?.result?.[0]
    if (!chart) {
      console.warn(`[YF] ${ticker}: sem chart.result`)
      return null
    }

    const timestamps: number[]       = chart.timestamp ?? []
    const closes: number[]           = chart.indicators?.quote?.[0]?.close ?? []
    const volumes: (number | null)[] = chart.indicators?.quote?.[0]?.volume ?? []

    if (timestamps.length < minPoints) {
      console.warn(`[YF] ${ticker}: só ${timestamps.length} barras`)
      return null
    }

    const bars: DailyBar[] = timestamps
      .map((ts, i) => ({
        date:   new Date(ts * 1000).toISOString().split('T')[0],
        close:  Number(closes[i]),
        volume: volumes[i] != null ? Number(volumes[i]) : undefined,
      }))
      .filter(d => d.date && isFinite(d.close) && d.close > 0)
      .sort((a, b) => a.date.localeCompare(b.date))

    if (bars.length < minPoints) {
      console.warn(`[YF] ${ticker}: após filtro ${bars.length} barras`)
      return null
    }

    console.log(`[YF] ${ticker}: ok (${bars.length} barras)`)
    return { ticker, bars }
  } catch (e) {
    console.warn(`[YF] ${ticker}: exceção — ${e}`)
    return null
  }
}

/**
 * Batch-fetch histories for multiple tickers.
 *
 * NOTE: BRAPI's history endpoint (?range=1y&interval=1d) does NOT support
 * comma-separated tickers — it returns 400. Each ticker must be fetched
 * individually. We process `concurrency` tickers in parallel and pause
 * `delayMs` between groups to stay within BRAPI's rate limits.
 *
 * Safe defaults: concurrency=3, delayMs=400  →  ~7 req/sec
 * For 85 IBOV tickers:  ~12 s
 * For 400 tickers:      ~53 s
 */
export async function fetchHistoriesBatched(
  tickers: string[],
  concurrency = 3,
  delayMs = 400
): Promise<Map<string, TickerHistory>> {
  const results = new Map<string, TickerHistory>()

  for (let i = 0; i < tickers.length; i += concurrency) {
    const batch = tickers.slice(i, i + concurrency)
    const fetched = await Promise.all(batch.map(t => fetchHistory(t)))
    for (let j = 0; j < batch.length; j++) {
      const h = fetched[j]
      if (h) results.set(batch[j], h)
    }
    if (i + concurrency < tickers.length) {
      await sleep(delayMs)
    }
  }

  return results
}

// ─────────────────────────────────────────────────────────────────────────────
// Current quote
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch the current last price for a ticker.
 * Returns null on failure.
 */
export async function fetchQuote(ticker: string): Promise<TickerQuote | null> {
  const url = `${BRAPI_BASE}/quote/${encodeURIComponent(ticker)}?token=${TOKEN}`
  try {
    const res = await fetchWithRetry(url)
    if (!res.ok) return null
    const data = await res.json()
    const result = data?.results?.[0]
    if (!result) return null
    const price = Number(result.regularMarketPrice ?? result.close ?? 0)
    if (!isFinite(price) || price <= 0) return null
    return { ticker, price }
  } catch {
    return null
  }
}

/**
 * Batch-fetch current quotes for multiple tickers.
 */
export async function fetchQuotesBatched(
  tickers: string[],
  batchSize = 10,
  delayMs = 300
): Promise<Map<string, number>> {
  const results = new Map<string, number>()
  for (let i = 0; i < tickers.length; i += batchSize) {
    const batch = tickers.slice(i, i + batchSize)
    const fetched = await Promise.all(batch.map(t => fetchQuote(t)))
    for (let j = 0; j < batch.length; j++) {
      const q = fetched[j]
      if (q) results.set(batch[j], q.price)
    }
    if (i + batchSize < tickers.length) await sleep(delayMs)
  }
  return results
}

// ─────────────────────────────────────────────────────────────────────────────
// Price alignment: inner join on dates
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Align two price series to their common dates (inner join).
 * Returns arrays of close prices in chronological order.
 */
export function alignPriceSeries(
  a: TickerHistory,
  b: TickerHistory
): { datesA: string[]; pricesA: number[]; pricesB: number[] } {
  const mapB = new Map(b.bars.map(bar => [bar.date, bar.close]))
  const aligned = a.bars
    .filter(bar => mapB.has(bar.date))
    .map(bar => ({
      date: bar.date,
      priceA: bar.close,
      priceB: mapB.get(bar.date)!,
    }))

  return {
    datesA: aligned.map(d => d.date),
    pricesA: aligned.map(d => d.priceA),
    pricesB: aligned.map(d => d.priceB),
  }
}

/**
 * Align all ticker histories to dates common to every series.
 * Returns a map of ticker → price array (all same length, same date order).
 */
export function alignAllSeries(
  histories: Map<string, TickerHistory>
): { tickers: string[]; prices: Map<string, number[]>; dates: string[] } {
  const tickers = Array.from(histories.keys())
  if (tickers.length === 0) return { tickers: [], prices: new Map(), dates: [] }

  // Find common dates (intersection)
  let commonDates: Set<string> | null = null
  for (const h of Array.from(histories.values())) {
    const dateSet = new Set(h.bars.map(b => b.date))
    if (!commonDates) {
      commonDates = dateSet
    } else {
      for (const d of commonDates) {
        if (!dateSet.has(d)) commonDates.delete(d)
      }
    }
  }

  const dates = Array.from(commonDates ?? []).sort()
  const prices = new Map<string, number[]>()
  for (const [ticker, h] of histories) {
    const barMap = new Map(h.bars.map(b => [b.date, b.close]))
    const series = dates.map(d => barMap.get(d) ?? NaN).filter(v => isFinite(v))
    if (series.length === dates.length) {
      prices.set(ticker, series)
    }
  }

  return { tickers: Array.from(prices.keys()), prices, dates }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADV from history (more reliable than quote endpoint)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute average daily volume in BRL from historical bars.
 * Uses the last `lookbackDays` bars (default 63 = ~3 months of trading days).
 * ADV_BRL = mean(volume_shares) × mean(close_price)
 *
 * Returns 0 if volume data is not present in the bars.
 */
export function computeADVFromHistory(
  bars: DailyBar[],
  lookbackDays = 63
): number {
  const recent = bars.slice(-lookbackDays)
  if (recent.length === 0) return 0

  const barsWithVolume = recent.filter(b => b.volume != null && b.volume! > 0)
  if (barsWithVolume.length === 0) return 0

  const avgVolShares = barsWithVolume.reduce((s, b) => s + b.volume!, 0) / barsWithVolume.length
  const avgPrice     = recent.reduce((s, b) => s + b.close, 0) / recent.length

  return avgVolShares * avgPrice
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalize a BRAPI date value to ISO YYYY-MM-DD string.
 * BRAPI may return Unix timestamps (seconds) or ISO strings.
 */
function normalizeDate(raw: string | number): string {
  if (typeof raw === 'number') {
    // Unix timestamp in seconds
    return new Date(raw * 1000).toISOString().split('T')[0]
  }
  // Already a string — take just the date part
  return String(raw).split('T')[0]
}
