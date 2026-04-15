-- Seed default config values (idempotent)
insert into config (key, value, updated_at) values
  ('zscore_threshold',   '2.0',  now()),
  ('lookback_window',    '60',   now()),
  ('min_score',          '50',   now()),
  ('min_half_life',      '5',    now()),
  ('max_half_life',      '60',   now())
on conflict (key) do update set
  value      = excluded.value,
  updated_at = excluded.updated_at;
