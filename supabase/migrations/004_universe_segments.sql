-- Migration 004: Universe segments multi-select
-- Substitui universe_mode (ibov/full) por universe_segments (lista separada por vírgula)
-- Segmentos válidos: ibov, acoes_b3, bdr, fii, etf

INSERT INTO config (key, value)
VALUES ('universe_segments', 'ibov')
ON CONFLICT (key) DO NOTHING;

-- Mantém universe_mode por retrocompatibilidade (scanner faz fallback automático)
