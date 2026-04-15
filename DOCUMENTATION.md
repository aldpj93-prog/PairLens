# PairLens - Complete Codebase Documentation

## Project Overview

**PairLens** is a Next.js-based quantitative research platform for identifying and trading cointegrated pairs on the B3 (Brazilian stock exchange). It uses statistical arbitrage techniques to detect mean-reverting pairs of securities, providing both automated scanning and manual trade logging.

---

## API Routes

### `GET/POST /api/config`
**File:** [app/api/config/route.ts](app/api/config/route.ts)

Reads and updates runtime configuration parameters stored in the `config` table.

- **GET** — Returns all config key-value pairs (zscore_threshold, lookback_window, min_score, min_half_life, max_half_life, liquidity thresholds, caps, universe_segments).
- **POST** — Upserts config keys with new values and timestamps.
- **Auth:** Requires authenticated Supabase session.

---

### `POST /api/scan`
**File:** [app/api/scan/route.ts](app/api/scan/route.ts)

Triggers a pair scanning operation in the background.

- **POST** — Calls `runPairScan('manual')` asynchronously and returns `{ok: true}` immediately. Client polls `/api/scan/status` for progress.
- **Auth:** Requires authenticated user.

---

### `GET /api/scan/status`
**File:** [app/api/scan/status/route.ts](app/api/scan/status/route.ts)

Returns real-time scan progress (polled every 2 seconds by the frontend).

- **GET** — Returns `{ running, phase, tickersFetched, tickersTotal, elapsedMs, scanRunId }`.
  - `phase`: `'idle' | 'universe' | 'fetching' | 'testing' | 'saving'`
- **Auth:** None (public endpoint).

---

### `GET /api/history`
**File:** [app/api/history/route.ts](app/api/history/route.ts)

Fetches 1-year daily price history for a pair of tickers and returns cointegration analysis.

- **Query Params:** `tickers` — comma-separated list (requires at least 2).
- **Returns:** `{ dates, pricesA, pricesB, residuals, zScores }` where `zScores` uses a 60-day rolling window.
- **Auth:** None (public endpoint).

---

### `GET/POST /api/operations`
**File:** [app/api/operations/route.ts](app/api/operations/route.ts)

Manages manual trade operations.

- **GET** — Returns all operations sorted by `entry_at` descending.
- **POST** — Creates a new open operation. Body: `{ ticker_a, ticker_b, signal, hedge_ratio, entry_ratio, target_ratio, stop_ratio, entry_price_a, entry_price_b, entry_qty_a, entry_qty_b, pair_id? }`. Returns `{ id }`.
- **Auth (POST):** Requires authenticated user.

---

### `PATCH /api/operations/[id]`
**File:** [app/api/operations/[id]/route.ts](app/api/operations/[id]/route.ts)

Closes an open operation and records exit prices + P&L.

- **PATCH** — Body: `{ exit_price_a, exit_price_b }`. Computes exit ratio and P&L based on signal direction, then updates status to `'closed'`. Returns `{ ok: true, pnl_pct }`.
- **Auth:** Requires authenticated user.

---

### `GET /api/cron/scan`
**File:** [app/api/cron/scan/route.ts](app/api/cron/scan/route.ts)

Vercel Cron Job entry point for automated scanning.

- **GET** — Validates `Authorization: Bearer <CRON_SECRET>` header, then calls `runPairScan(triggerType)`.
- **Schedule:** 14:00 UTC (11h BRT) → `cron_11h`, 18:00 UTC (15h BRT) → `cron_15h`, weekdays only.
- **Max Duration:** 300 seconds.

---

## Pages

### `/` — Home
**File:** [app/page.tsx](app/page.tsx)

Simple redirect to `/dashboard`.

---

### `/(auth)/login` — Login
**File:** [app/(auth)/login/page.tsx](app/(auth)/login/page.tsx)

Styled login form (dark theme, gold accents #c8a96e). Uses Supabase `signInWithPassword`. Redirects to `/dashboard` on success, shows error message on failure.

---

### `/dashboard` — Main Dashboard
**File:** [app/dashboard/page.tsx](app/dashboard/page.tsx)

Central hub for scan management and pair viewing.

- Polls `/api/scan/status` every 2 seconds while scanning is active.
- Supabase Realtime subscription on `scan_runs` (INSERT/UPDATE) to auto-refresh results.
- Displays scan metrics: `tickers_scanned`, `pairs_tested`, `cointegrated_pairs`, `active_signals`.
- **RankTable** component: interactive table showing pair stats (hedge ratio, p-value, z-score, half-life, score, signal) with "EXECUTAR" button → opens **ExecutarModal** for trade entry.
- Z-score threshold input: adjusts and saves `zscore_threshold` via `/api/config`.

---

### `/dashboard/operations` — Open Operations
**File:** [app/dashboard/operations/page.tsx](app/dashboard/operations/page.tsx)

Lists all currently open operations.

- Fetches from `/api/operations`, filters `status='open'`.
- **OperationCard** per trade: shows pair, signal badge, entry/target/stop/current ratios, live P&L, entry date (BRT), and a **RatioChart** (dynamically loaded).
- "ENCERRAR OPERACAO" → **CloseModal** to record exit prices.

---

### `/dashboard/performance` — Trade Analytics
**File:** [app/dashboard/performance/page.tsx](app/dashboard/performance/page.tsx)

Analytics over closed operations.

- Metrics: total trades, win rate, average P&L, average duration, best/worst trade.
- Closed operations table: index, pair, direction, entry ratio, exit ratio, P&L % (color-coded), exit date.
- **ScanHistoryChart** (dynamically loaded): timeline of last 30 scans with pairs-found count.

---

### `/dashboard/settings` — Configuration
**File:** [app/dashboard/settings/page.tsx](app/dashboard/settings/page.tsx)

Full configuration UI. Loads config from DB on mount, saves via `/api/config` POST.

| Section | Keys |
|---------|------|
| Universe Segments | ibov, acoes_b3, bdr, fii, etf |
| Scanner Params | zscore_threshold (0.5–5.0), lookback_window (20–252), min_score (0–100), min_half_life (1–30), max_half_life (10–365) |
| Liquidity Filters | min_adv_stock, min_adv_fii, min_adv_etf, min_adv_bdr |
| Advanced Filters | corr_threshold, cap_stock (200), cap_fii (100), cap_etf (30), cap_bdr (50) |

---

### `/dashboard/education` — Educational Guide
**File:** [app/dashboard/education/page.tsx](app/dashboard/education/page.tsx)

Portuguese-language educational content with SVG visualizations explaining cointegration, spread/residuals, z-score threshold zones, and normal distributions.

---

### `/dashboard/layout` — Dashboard Layout
**File:** [app/dashboard/layout.tsx](app/dashboard/layout.tsx)

Server component. Checks auth via SSR and redirects unauthenticated users. Renders fixed left sidebar (220px) with logo, navigation (**NavLinks**), scan status indicator (**ScanRunStatus**), and logout button.

---

## Database Schema & Migrations

### Migration 001 — Core Tables
**File:** [supabase/migrations/001_initial_schema.sql](supabase/migrations/001_initial_schema.sql)

**`scan_runs`** — One record per scan execution.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | Unique scan ID |
| triggered_at | timestamptz | When triggered |
| trigger_type | text | `'cron_11h' \| 'cron_15h' \| 'manual'` |
| tickers_scanned | int | Tickers in final universe |
| pairs_tested | int | Total pairs tested |
| pairs_found | int | Pairs with p < 0.05 |
| duration_ms | int | Execution time |
| status | text | `'running' \| 'completed' \| 'failed'` |
| error_message | text | Details if failed |

**`cointegrated_pairs`** — Output of each scan.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | Pair ID |
| scan_run_id | uuid FK | Parent scan |
| ticker_a, ticker_b | text | Security tickers |
| hedge_ratio | numeric | Beta (shares of B per A) |
| adf_statistic, p_value | numeric | ADF test results |
| z_score | numeric | Current spread z-score |
| half_life | numeric | Mean reversion half-life (days) |
| score | int | Quality score 0–100 |
| signal | text | `'long_spread' \| 'short_spread' \| 'neutral'` |
| price_a, price_b | numeric | Prices at scan time |
| spread_mean, spread_std | numeric | Spread statistics |
| is_active | boolean | Still valid (default true) |

**`config`** — Runtime configuration key-value store.

Default values: `zscore_threshold=2.0`, `lookback_window=60`, `min_score=50`, `min_half_life=5`, `max_half_life=60`.

RLS enabled on all tables; authenticated users get full CRUD.

---

### Migration 002 — Liquidity Config
**File:** [supabase/migrations/002_liquidity_config.sql](supabase/migrations/002_liquidity_config.sql)

Adds to `config`: `min_adv_stock=5000000`, `min_adv_fii=500000`, `min_adv_etf=50000`, `min_adv_bdr=2000000`.

---

### Migration 003 — Scanner Caps
**File:** [supabase/migrations/003_scanner_caps.sql](supabase/migrations/003_scanner_caps.sql)

Adds to `config`: `corr_threshold=0.80`, `cap_stock=200`, `cap_fii=100`, `cap_etf=30`, `cap_bdr=50`.

---

### Migration 004 — Universe Segments
**File:** [supabase/migrations/004_universe_segments.sql](supabase/migrations/004_universe_segments.sql)

Adds `universe_segments='ibov'` to `config`. Replaces the old `universe_mode` single-select with a comma-separated multi-select string.

---

### Migration 005 — Operations Table
**File:** [supabase/migrations/005_operations_manual.sql](supabase/migrations/005_operations_manual.sql)

Creates the `operations` table (replaces deprecated `operation_log`).

| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | Operation ID |
| ticker_a, ticker_b | text | Pair tickers |
| signal | text | `'long_spread' \| 'short_spread'` |
| hedge_ratio | numeric | Beta coefficient |
| entry_ratio | numeric | price_a / price_b at entry |
| target_ratio | numeric | Mean reversion target |
| stop_ratio | numeric | 3-sigma stop loss |
| entry_price_a/b | numeric | Entry prices |
| entry_qty_a/b | numeric | Quantities purchased |
| entry_at | timestamptz | Entry timestamp |
| exit_price_a/b | numeric | Exit prices (NULL if open) |
| exit_ratio | numeric | Ratio at exit |
| exit_at | timestamptz | Exit timestamp (NULL if open) |
| pnl_pct | numeric | Profit/loss percentage |
| status | text | `'open' \| 'closed'` |
| pair_id | uuid FK | Optional ref to cointegrated_pairs |

---

### `supabase/seed.sql`
**File:** [supabase/seed.sql](supabase/seed.sql)

Seeds default config values idempotently via `ON CONFLICT DO UPDATE`.

---

## Library Modules

### `lib/supabase.ts` — Client Factories
**File:** [lib/supabase.ts](lib/supabase.ts)

| Function | Usage |
|----------|-------|
| `createAdminClient()` | Server-side, service role key, bypasses RLS. Used in API routes and cron jobs. |
| `createBrowserSupabaseClient()` | Browser client, anon key, respects RLS. For client components. |
| `createSSRClient(cookieStore)` | Server-side SSR client, manages auth via cookies. For server components. |

Also exports TypeScript types: `ScanRun`, `CointegratedPair`, `Operation`, `Config`.

---

### `lib/brapi.ts` — Market Data Client
**File:** [lib/brapi.ts](lib/brapi.ts)

Fetches data from BRAPI (Brazilian API) and Yahoo Finance.

| Function | Description |
|----------|-------------|
| `classifyTicker(ticker)` | Returns asset type (`stock \| fii \| etf \| bdr`) based on ticker suffix |
| `fetchTickerList()` | All available tickers from BRAPI `/quote/list` (up to 2000) |
| `fetchADVBatched(tickers)` | Batch ADV fetch in BRL via BRAPI, with retry/backoff |
| `fetchHistory(ticker)` | 1-year daily OHLCV via Yahoo Finance (`.SA` suffix). Returns null if < 120 points |
| `fetchHistoriesBatched(tickers)` | Concurrent history fetches (3 parallel, 400ms between rounds) |
| `alignPriceSeries(a, b)` | Inner-join two price series on common dates |
| `alignAllSeries(histories)` | Align all ticker histories to intersection of dates |
| `computeADVFromHistory(bars)` | ADV from last 63 bars: mean(volume) × mean(close) |
| `fetchQuote(ticker)` | Current last price for one ticker |
| `fetchQuotesBatched(tickers)` | Current prices for multiple tickers (batch of 10) |

---

### `lib/scanner.ts` — Scan Orchestrator
**File:** [lib/scanner.ts](lib/scanner.ts)

**`runPairScan(triggerType)`** — 7-step pipeline:

1. Create `scan_runs` record (status=`'running'`).
2. Load candidate universe via `getCandidateTickers()` for configured segments.
3. Fetch 1-year histories from Yahoo Finance (3 parallel, 400ms delay).
4. Filter by liquidity: calculate ADV, apply per-type minimums and caps.
5. Test cointegration: align series → Pearson filter (0.80) → Engle-Granger ADF → compute z-score, half-life, score, signal.
6. Save results: fetch current prices → insert into `cointegrated_pairs`.
7. Update `scan_runs` to `'completed'` with final metrics.

Global `scanProgress` object updated throughout; polled by `/api/scan/status`.

---

### `lib/stats.ts` — Statistical Engine
**File:** [lib/stats.ts](lib/stats.ts)

Pure TypeScript econometric implementations.

| Function | Description |
|----------|-------------|
| `olsRegression(y, x)` | OLS: y = α + β·x. Returns `{alpha, beta, residuals}` |
| `adfTest(series, maxLag?)` | Augmented Dickey-Fuller test. AIC lag selection. P-value via MacKinnon (1994). |
| `testCointegration(priceA, priceB)` | Engle-Granger 2-step. Tests both A~B and B~A, picks lower statistic. Returns `{hedgeRatio, residuals, adfStatistic, pValue, spreadMean, spreadStd, currentZScore, halfLifeDays}` |
| `computeZScoreSeries(residuals, window=60)` | Rolling z-score. Returns `NaN` before window fills. |
| `computeHalfLife(spread)` | AR(1) half-life: `−ln(2) / ln(1 + φ)`. Returns `Infinity` if not mean-reverting. |
| `rankPair({pValue, currentZScore, halfLifeDays})` | Quality score 0–100: 30% ADF strength + 40% z-score magnitude + 30% half-life quality (optimal 5–30 days) |
| `pearsonCorrelation(a, b)` | Fast Pearson correlation pre-filter before ADF |

---

### `lib/universe.ts` — Asset Universe Builder
**File:** [lib/universe.ts](lib/universe.ts)

Builds candidate ticker lists by segment.

| Segment | Source | Asset Type | Count |
|---------|--------|-----------|-------|
| `ibov` | Static array | stock | 85 |
| `acoes_b3` | BRAPI | stock | 400+ |
| `bdr` | BRAPI | bdr | ~50 |
| `fii` | BRAPI | fii | ~150 |
| `etf` | BRAPI | etf | 70+ |

**`getCandidateTickers(segments)`** — Returns `{tickers, types}`. If both `ibov` and `acoes_b3` selected, uses `acoes_b3` (superset).

**`parseSegments(raw)`** — Parses comma-separated DB string into `UniverseSegment[]`. Defaults to `['ibov']`.

---

### `lib/utils.ts` — Formatting Utilities
**File:** [lib/utils.ts](lib/utils.ts)

| Function | Output Example |
|----------|----------------|
| `fmt4(n)` | `"3.1416"` |
| `fmt2(n)` | `"3.14"` |
| `fmtPct(n)` | `"+2.50%"` |
| `fmtP(n)` | `"0.0234"` |
| `fmtPrice(n)` | `"23.45"` |
| `fmtHL(n)` | `"12d"` or `"Inf"` |
| `fmtScore(n)` | `"75"` |
| `fmtDateBRT(iso)` | `"14/04/2026 10:30"` (BRT/America/Sao_Paulo) |
| `fmtDays(n)` | `"3.5d"` |
| `signalLabel(s)` | `"LONG SPREAD"` / `"SHORT SPREAD"` |
| `fmtHedge(beta)` | `"3.33 : 1"` or `"1 : 2.00"` |

---

## Scripts

### `scripts/seed-user.ts` — Admin User Seeder
**File:** [scripts/seed-user.ts](scripts/seed-user.ts)

Run with `npm run seed-user`. Creates or updates the admin user (`admin@pairlens.local` / `2518Jnr@`) using the service role key. Sets `email_confirm=true`.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server only) |
| `BRAPI_TOKEN` | BRAPI authentication token |
| `CRON_SECRET` | Bearer token for cron endpoint authorization |
| `ZSCORE_THRESHOLD` | Optional env override for z-score threshold (default 2.0) |

---

## Complete Scan-to-Trade Workflow

1. **Trigger:** User clicks "RUN SCAN NOW" → POST `/api/scan` → returns immediately. Frontend polls `/api/scan/status` every 2s.

2. **Scan Pipeline** (background):
   - Creates `scan_runs` record (status=`'running'`).
   - Loads config from DB.
   - Fetches IBOV tickers' 1-year history (~12s for 85 tickers).
   - Filters by ADV ≥ 5M R$/day, caps at 200.
   - Tests each same-type pair: correlation filter → ADF → saves cointegrated pairs.
   - Updates `scan_runs` to `'completed'`.

3. **Results Display:** Poll detects `running=false` → fetches latest scan → **RankTable** populated.

4. **Trade Entry:** User clicks "EXECUTAR" → **ExecutarModal** pre-fills ratios → user enters quantities → POST `/api/operations`.

5. **Trade Management:** Operation visible on `/dashboard/operations` with **RatioChart** and live P&L → "ENCERRAR OPERACAO" → **CloseModal** → PATCH `/api/operations/[id]`.

6. **Analytics:** `/dashboard/performance` shows win rate, avg P&L, best/worst trades, and scan history chart.
