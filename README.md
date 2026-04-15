# PairLens

Statistical arbitrage scanner for Brazilian B3 equities using cointegration analysis (Augmented Dickey-Fuller test).

## Architecture

- **Framework**: Next.js 14 (App Router, TypeScript strict mode)
- **Database**: Supabase (PostgreSQL + Auth + Realtime)
- **Styling**: Tailwind CSS — dark research-terminal theme
- **Charts**: Recharts
- **Stats engine**: Pure TypeScript — OLS, ADF test, Engle-Granger CADF
- **Data source**: BRAPI REST API (B3 equities)
- **Deployment**: Vercel with scheduled Cron Jobs

---

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

| Variable | Source |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project settings → API → service_role |
| `CRON_SECRET` | Any random string (also set in Vercel) |
| `BRAPI_TOKEN` | Pre-configured — `wmpzMXRG97E5VveAb8rGzH` |

### 3. Run Supabase migration

In the Supabase dashboard → SQL editor, run:

```sql
-- contents of supabase/migrations/001_initial_schema.sql
```

Or via Supabase CLI:

```bash
supabase db push
```

### 4. Seed admin user

```bash
npm run seed-user
```

This creates `admin@pairlens.local` / `2518Jnr@` via the Supabase Admin API.

### 5. Start dev server

```bash
npm run dev
```

Navigate to `http://localhost:3000` — redirects to `/dashboard` (requires login).

---

## Vercel Deployment

### 1. Push to GitHub and connect to Vercel

### 2. Set environment variables in Vercel project settings

Same variables as `.env.local`, plus set `CRON_SECRET` to match.

### 3. Cron jobs

`vercel.json` defines two scheduled jobs (weekdays):

| UTC time | BRT time | Trigger type |
|---|---|---|
| 14:00 | 11:00 | `cron_11h` |
| 18:00 | 15:00 | `cron_15h` |

The cron endpoint (`/api/cron/scan`) is protected by `Authorization: Bearer <CRON_SECRET>`.
Vercel sets this header automatically via the `CRON_SECRET` environment variable.

### 4. Supabase Realtime

Enable Realtime on tables `scan_runs` and `cointegrated_pairs` in the Supabase dashboard (Table Editor → Replication → enable for these tables).

---

## Statistical Engine

All math is implemented from scratch in `lib/stats.ts`:

- **OLS regression**: `olsRegression(y, x)`
- **ADF test**: `adfTest(series, maxLag?)` — uses AIC lag selection, MacKinnon (1994) p-value approximation
- **Engle-Granger CADF**: `testCointegration(priceA, priceB)` — tests both directions
- **Rolling z-score**: `computeZScoreSeries(residuals, window)`
- **Half-life**: `computeHalfLife(spread)` — AR(1) approach
- **Pair scoring**: `rankPair({ pValue, currentZScore, halfLifeDays })` — composite 0–100 score

**Known limitation**: ADF p-value uses piecewise linear interpolation between MacKinnon 1%, 5%, 10% critical values. Adequate for screening; not for exact inference.

---

## Scan Engine

`lib/scanner.ts` → `runPairScan(triggerType)`:

1. Fetches 1-year daily history for all 85 IBOV tickers (BRAPI)
2. Aligns to common dates (inner join)
3. Correlation pre-filter: `|r| > 0.7` (reduces ~3700 → ~200–400 pairs)
4. ADF cointegration test on qualifying pairs
5. Inserts cointegrated pairs (p < 0.05) into Supabase
6. Auto-logs operations for pairs with score ≥ 50 and active signal
7. Updates scan_run record with counts and duration

---

## Pages

| Route | Description |
|---|---|
| `/login` | Auth — email + password |
| `/dashboard` | Scanner — ranked cointegrated pairs table + detail charts |
| `/dashboard/operations` | Operation log — open and closed trades |
| `/dashboard/performance` | Performance tracker — P&L metrics and charts |
| `/dashboard/settings` | Runtime config — thresholds, windows |

---

## Signal Logic

| Condition | Signal |
|---|---|
| Z-score > threshold | `short_spread` — sell A, buy B |
| Z-score < -threshold | `long_spread` — buy A, sell B |
| Otherwise | `neutral` |

Default threshold: **2.0σ** (configurable in Settings).

---

## P&L Calculation

For closed operations:

```
long_spread:  pnl = (exitA/entryA - 1) - hedge * (exitB/entryB - 1)
short_spread: pnl = -(exitA/entryA - 1) + hedge * (exitB/entryB - 1)
```

Expressed as percentage.
