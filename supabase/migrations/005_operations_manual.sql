-- Migration 005: Manual operations table
-- Users manually log their executed trades

CREATE TABLE IF NOT EXISTS operations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker_a        text NOT NULL,
  ticker_b        text NOT NULL,
  signal          text NOT NULL,            -- 'long_spread' | 'short_spread'
  hedge_ratio     numeric(12,6),

  -- Statistical levels at entry time
  entry_ratio     numeric(12,6) NOT NULL,   -- price_a / price_b at entry
  target_ratio    numeric(12,6),            -- mean (reversion target)
  stop_ratio      numeric(12,6),            -- ±3σ level (stop loss)

  -- Entry execution (user-entered)
  entry_price_a   numeric(12,4) NOT NULL,
  entry_price_b   numeric(12,4) NOT NULL,
  entry_qty_a     numeric(14,2) NOT NULL,
  entry_qty_b     numeric(14,2) NOT NULL,
  entry_at        timestamptz DEFAULT now(),

  -- Exit execution (filled on close)
  exit_price_a    numeric(12,4),
  exit_price_b    numeric(12,4),
  exit_ratio      numeric(12,6),
  exit_at         timestamptz,

  pnl_pct         numeric(8,4),
  status          text DEFAULT 'open' CHECK (status IN ('open', 'closed')),

  pair_id         uuid REFERENCES cointegrated_pairs(id) ON DELETE SET NULL
);

ALTER TABLE operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_full_access_operations_manual"
  ON operations FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_operations_status   ON operations(status);
CREATE INDEX IF NOT EXISTS idx_operations_tickers  ON operations(ticker_a, ticker_b);
CREATE INDEX IF NOT EXISTS idx_operations_entry_at ON operations(entry_at DESC);

-- Clear old auto-generated operation_log data
TRUNCATE operation_log;
