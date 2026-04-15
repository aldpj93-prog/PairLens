-- ============================================================
-- PairLens — initial schema
-- ============================================================

-- scan_runs: records each full scan execution
create table if not exists scan_runs (
  id              uuid primary key default gen_random_uuid(),
  triggered_at    timestamptz not null default now(),
  trigger_type    text not null,           -- 'cron_11h' | 'cron_15h' | 'manual'
  tickers_scanned integer,
  pairs_tested    integer,
  pairs_found     integer,
  duration_ms     integer,
  status          text,                    -- 'running' | 'completed' | 'failed'
  error_message   text
);

-- cointegrated_pairs: output of each scan
create table if not exists cointegrated_pairs (
  id            uuid primary key default gen_random_uuid(),
  scan_run_id   uuid references scan_runs(id) on delete cascade,
  ticker_a      text not null,
  ticker_b      text not null,
  hedge_ratio   numeric(12,6),
  adf_statistic numeric(12,6),
  p_value       numeric(10,6),
  z_score       numeric(10,4),
  half_life     numeric(8,2),
  score         integer,
  signal        text,                      -- 'long_spread' | 'short_spread' | 'neutral'
  price_a       numeric(12,4),
  price_b       numeric(12,4),
  spread_mean   numeric(12,6),
  spread_std    numeric(12,6),
  created_at    timestamptz default now(),
  is_active     boolean default true
);

-- operation_log: trade journal auto-populated by scan
create table if not exists operation_log (
  id             uuid primary key default gen_random_uuid(),
  pair_id        uuid references cointegrated_pairs(id) on delete set null,
  ticker_a       text not null,
  ticker_b       text not null,
  signal         text not null,            -- 'long_spread' | 'short_spread'
  entry_z_score  numeric(10,4),
  entry_price_a  numeric(12,4),
  entry_price_b  numeric(12,4),
  entry_hedge    numeric(12,6),
  entry_at       timestamptz default now(),
  exit_z_score   numeric(10,4),
  exit_price_a   numeric(12,4),
  exit_price_b   numeric(12,4),
  exit_at        timestamptz,
  exit_reason    text,                     -- 'z_reversion' | 'stop_loss' | 'manual'
  pnl_pct        numeric(8,4),
  status         text default 'open',     -- 'open' | 'closed'
  duration_days  numeric(6,2)
);

-- config: runtime parameters
create table if not exists config (
  key        text primary key,
  value      text,
  updated_at timestamptz default now()
);

-- default config values
insert into config (key, value) values
  ('zscore_threshold',   '2.0'),
  ('lookback_window',    '60'),
  ('min_score',          '50'),
  ('min_half_life',      '5'),
  ('max_half_life',      '60')
on conflict (key) do nothing;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table scan_runs        enable row level security;
alter table cointegrated_pairs enable row level security;
alter table operation_log    enable row level security;
alter table config           enable row level security;

-- Authenticated users get full access to all tables
create policy "authenticated_full_access_scan_runs"
  on scan_runs for all to authenticated using (true) with check (true);

create policy "authenticated_full_access_pairs"
  on cointegrated_pairs for all to authenticated using (true) with check (true);

create policy "authenticated_full_access_operations"
  on operation_log for all to authenticated using (true) with check (true);

create policy "authenticated_full_access_config"
  on config for all to authenticated using (true) with check (true);

-- Service role bypasses RLS (needed for cron/API routes using service key)
-- This is the default Supabase behavior — no extra policy needed.

-- ============================================================
-- Indexes for query performance
-- ============================================================

create index if not exists idx_cointegrated_pairs_scan_run
  on cointegrated_pairs(scan_run_id);

create index if not exists idx_cointegrated_pairs_tickers
  on cointegrated_pairs(ticker_a, ticker_b);

create index if not exists idx_operation_log_status
  on operation_log(status);

create index if not exists idx_operation_log_tickers
  on operation_log(ticker_a, ticker_b);

create index if not exists idx_scan_runs_triggered_at
  on scan_runs(triggered_at desc);
