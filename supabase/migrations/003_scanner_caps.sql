-- Migration 003: Add scanner cap and correlation config keys
INSERT INTO config (key, value) VALUES
  ('corr_threshold', '0.80'),
  ('cap_stock',      '200'),
  ('cap_fii',        '100'),
  ('cap_etf',        '30'),
  ('cap_bdr',        '50')
ON CONFLICT (key) DO NOTHING;
