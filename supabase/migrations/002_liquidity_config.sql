-- ============================================================
-- PairLens — migration 002: liquidity thresholds in config
-- ============================================================

insert into config (key, value, updated_at) values
  ('min_adv_stock', '5000000', now()),
  ('min_adv_fii',   '500000',  now()),
  ('min_adv_etf',   '50000',   now()),
  ('min_adv_bdr',   '2000000', now())
on conflict (key) do nothing;
