/**
 * PairLens — Supabase client factory
 *
 * - createServerClient: for API routes and server components (service role key)
 * - createBrowserClient: for client components
 * - createSSRClient: for middleware and server components using cookies
 */

import { createClient } from '@supabase/supabase-js'
import { createServerClient as _createServerClient, createBrowserClient as _createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

/** Server-side admin client (bypasses RLS via service role key). */
export function createAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  })
}

/** Browser client for client components. */
export function createBrowserSupabaseClient() {
  return _createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

/** SSR-aware server client (respects cookies for session). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createSSRClient(cookieStore: any) {
  return _createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            (cookieStore as any).set(name, value, options)
          )
        } catch {
          // Server component — cookies cannot be set from here
        }
      },
    },
  })
}

// Database type helpers
export type ScanRun = {
  id: string
  triggered_at: string
  trigger_type: string
  tickers_scanned: number | null
  pairs_tested: number | null
  pairs_found: number | null
  duration_ms: number | null
  status: string | null
  error_message: string | null
}

export type CointegratedPair = {
  id: string
  scan_run_id: string
  ticker_a: string
  ticker_b: string
  hedge_ratio: number | null
  adf_statistic: number | null
  p_value: number | null
  z_score: number | null
  half_life: number | null
  score: number | null
  signal: string | null
  price_a: number | null
  price_b: number | null
  spread_mean: number | null
  spread_std: number | null
  created_at: string
  is_active: boolean
}

export type OperationLog = {
  id: string
  pair_id: string | null
  ticker_a: string
  ticker_b: string
  signal: string
  entry_z_score: number | null
  entry_price_a: number | null
  entry_price_b: number | null
  entry_hedge: number | null
  entry_at: string
  exit_z_score: number | null
  exit_price_a: number | null
  exit_price_b: number | null
  exit_at: string | null
  exit_reason: string | null
  pnl_pct: number | null
  status: string
  duration_days: number | null
}

export type Operation = {
  id:             string
  ticker_a:       string
  ticker_b:       string
  signal:         string
  hedge_ratio:    number | null
  entry_ratio:    number
  target_ratio:   number | null
  stop_ratio:     number | null
  entry_price_a:  number
  entry_price_b:  number
  entry_qty_a:    number
  entry_qty_b:    number
  entry_at:       string
  exit_price_a:   number | null
  exit_price_b:   number | null
  exit_ratio:     number | null
  exit_at:        string | null
  pnl_pct:        number | null
  status:         string
  pair_id:        string | null
}

export type Config = {
  key: string
  value: string
  updated_at: string
}
