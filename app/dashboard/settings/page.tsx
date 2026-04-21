'use client'

import React, { useEffect, useState, FormEvent } from 'react'

const UNIVERSE_SEGMENT_OPTIONS = [
  { key: 'ibov',     label: 'Ibovespa', description: '85 ações que compõem o índice Ibovespa (~15s)' },
  { key: 'acoes_b3', label: 'Ações B3', description: 'Todas as ações listadas na B3 (~4min)'         },
  { key: 'bdr',      label: 'BDR',      description: 'Recibos de Depósito Brasileiros listados na B3' },
  { key: 'fii',      label: 'FII',      description: 'Fundos de Investimento Imobiliário'             },
  { key: 'etf',      label: 'ETF',      description: 'Fundos de índice (Exchange Traded Funds)'       },
] as const

interface ConfigState {
  zscore_threshold:  string
  lookback_window:   string
  min_score:         string
  min_half_life:     string
  max_half_life:     string
  min_adv_stock:     string
  min_adv_fii:       string
  min_adv_etf:       string
  min_adv_bdr:       string
  corr_threshold:    string
  cap_stock:         string
  cap_fii:           string
  cap_etf:           string
  cap_bdr:           string
  universe_segments: string   // comma-separated: "ibov,fii,etf"
}

const DEFAULTS: ConfigState = {
  zscore_threshold:  '2.0',
  lookback_window:   '60',
  min_score:         '50',
  min_half_life:     '5',
  max_half_life:     '60',
  min_adv_stock:     '5000000',
  min_adv_fii:       '500000',
  min_adv_etf:       '50000',
  min_adv_bdr:       '2000000',
  corr_threshold:    '0.80',
  cap_stock:         '200',
  cap_fii:           '100',
  cap_etf:           '30',
  cap_bdr:           '50',
  universe_segments: 'ibov',
}

type FieldMeta = {
  key:         keyof ConfigState
  label:       string
  type:        'number'
  step?:       string
  min?:        string
  max?:        string
  description: string
  section?:    string
}

const FIELD_META: FieldMeta[] = [
  {
    key: 'zscore_threshold',
    label: 'Z-SCORE THRESHOLD',
    type: 'number', step: '0.1', min: '0.5', max: '5.0',
    description: 'Z-score necessário para gerar um sinal. Default 2.0.',
    section: 'SCANNER',
  },
  {
    key: 'lookback_window',
    label: 'LOOKBACK WINDOW (dias)',
    type: 'number', step: '1', min: '20', max: '252',
    description: 'Janela de cálculo do z-score em dias. Default 60.',
  },
  {
    key: 'min_score',
    label: 'SCORE MÍNIMO (auto-log)',
    type: 'number', step: '1', min: '0', max: '100',
    description: 'Score mínimo (0–100) para registrar operação automaticamente. Default 50.',
  },
  {
    key: 'min_half_life',
    label: 'HALF-LIFE MÍNIMO (dias)',
    type: 'number', step: '1', min: '1', max: '30',
    description: 'Meia-vida mínima de reversão à média. Default 5.',
  },
  {
    key: 'max_half_life',
    label: 'HALF-LIFE MÁXIMO (dias)',
    type: 'number', step: '1', min: '10', max: '365',
    description: 'Meia-vida máxima de reversão à média. Default 60.',
  },
  {
    key: 'min_adv_stock',
    label: 'LIQUIDEZ MÍNIMA — AÇÕES (R$/dia)',
    type: 'number', step: '100000', min: '100000',
    description: 'Volume médio diário mínimo em R$ para ações. Default R$ 5.000.000.',
    section: 'LIQUIDEZ',
  },
  {
    key: 'min_adv_fii',
    label: 'LIQUIDEZ MÍNIMA — FIIs (R$/dia)',
    type: 'number', step: '50000', min: '10000',
    description: 'Volume médio diário mínimo em R$ para FIIs. Default R$ 500.000.',
  },
  {
    key: 'min_adv_etf',
    label: 'LIQUIDEZ MÍNIMA — ETFs (R$/dia)',
    type: 'number', step: '10000', min: '5000',
    description: 'Volume médio diário mínimo em R$ para ETFs. Default R$ 50.000.',
  },
  {
    key: 'min_adv_bdr',
    label: 'LIQUIDEZ MÍNIMA — BDRs (R$/dia)',
    type: 'number', step: '100000', min: '100000',
    description: 'Volume médio diário mínimo em R$ para BDRs. Default R$ 2.000.000.',
  },
  {
    key: 'corr_threshold',
    label: 'CORRELAÇÃO MÍNIMA',
    type: 'number', step: '0.01', min: '0.50', max: '0.99',
    description: 'Correlação de Pearson mínima antes do teste ADF. Default 0.80.',
    section: 'FILTROS AVANÇADOS',
  },
  {
    key: 'cap_stock',
    label: 'CAP — AÇÕES (top N por liquidez)',
    type: 'number', step: '10', min: '10', max: '500',
    description: 'Máximo de ações no scan, ordenadas por liquidez. Default 200.',
  },
  {
    key: 'cap_fii',
    label: 'CAP — FIIs (top N por liquidez)',
    type: 'number', step: '10', min: '10', max: '300',
    description: 'Máximo de FIIs no scan. Default 100.',
  },
  {
    key: 'cap_etf',
    label: 'CAP — ETFs (top N por liquidez)',
    type: 'number', step: '5', min: '5', max: '100',
    description: 'Máximo de ETFs no scan. Default 30.',
  },
  {
    key: 'cap_bdr',
    label: 'CAP — BDRs (top N por liquidez)',
    type: 'number', step: '10', min: '10', max: '200',
    description: 'Máximo de BDRs no scan. Default 50.',
  },
]

export default function SettingsPage() {
  const [config, setConfig]   = useState<ConfigState>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/express/config', { credentials: 'include', method: 'get' })
      .then(res => res.ok ? res.json() : null)
      .then((data: unknown) => {
        if (data) {
          const map: Record<string, string> = Array.isArray(data)
            ? Object.fromEntries(
                (data as { key: string; value: string }[]).map(r => [r.key, r.value])
              )
            : Object.fromEntries(
                Object.entries(data as Record<string, unknown>).map(([k, v]) => [k, String(v)])
              )
          if (!map.universe_segments && map.universe_mode) {
            map.universe_segments = map.universe_mode === 'full'
              ? 'acoes_b3,bdr,fii,etf'
              : 'ibov'
          }
          setConfig(prev => ({ ...prev, ...map }))
        }
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)

    const res = await fetch('/api/express/config', {
      method: 'POST',
      credentials: "include",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })

    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      setError('Falha ao salvar configurações.')
    }
  }

  // ── Helpers para multi-select ───────────────────────────────────────────────
  function getActiveSegments(): string[] {
    return config.universe_segments
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  }

  function toggleSegment(key: string) {
    const current = getActiveSegments()
    const next = current.includes(key)
      ? current.filter(k => k !== key)
      : [...current, key]
    if (next.length === 0) return // pelo menos 1 sempre selecionado
    setConfig(prev => ({ ...prev, universe_segments: next.join(',') }))
  }

  const inputStyle: React.CSSProperties = {
    width: 160,
    background: '#2a2a2a',
    border: '1px solid #3d3d3d',
    color: '#f5f5f5',
    padding: '7px 10px',
    fontSize: 13,
    fontFamily: '"JetBrains Mono", monospace',
    borderRadius: 2,
    outline: 'none',
  }

  const activeSegments = getActiveSegments()

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontSize: 13, letterSpacing: '0.1em', color: '#f5f5f5',
          fontFamily: 'system-ui', margin: '0 0 4px', fontWeight: 500,
        }}>
          SETTINGS
        </h1>
        <p style={{ color: '#8a8a8a', fontSize: 11, fontFamily: 'system-ui', margin: 0 }}>
          Parâmetros do scanner. Aplicados no próximo scan.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{ height: 60, background: '#1f1f1f', borderRadius: 2 }} />
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ maxWidth: 560 }}>

          {/* ── Universo do Scan (multi-select) ───────────────────────────── */}
          <div style={{ marginBottom: 1 }}>
            <div style={{
              padding: '10px 20px 6px',
              background: '#1f1f1f',
              borderBottom: '1px solid #2e2e2e',
            }}>
              <p style={{
                color: '#8a8a8a', fontSize: 10, letterSpacing: '0.12em',
                fontFamily: 'system-ui', margin: 0,
              }}>
                UNIVERSO DO SCAN
              </p>
            </div>

            <div style={{
              background: '#1f1f1f',
              borderBottom: '1px solid #2e2e2e',
              padding: '16px 20px',
            }}>
              <p style={{
                color: '#a0a0a0', fontSize: 11, letterSpacing: '0.1em',
                fontFamily: 'system-ui', margin: '0 0 4px',
              }}>
                SEGMENTOS A INCLUIR
              </p>
              <p style={{ color: '#8a8a8a', fontSize: 11, fontFamily: 'system-ui', margin: '0 0 14px' }}>
                Selecione um ou mais grupos de ativos. Pares são testados somente dentro do mesmo tipo.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {UNIVERSE_SEGMENT_OPTIONS.map(opt => {
                  const active = activeSegments.includes(opt.key)
                  return (
                    <label
                      key={opt.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 14px',
                        background: active ? 'rgba(212,184,122,0.05)' : '#2a2a2a',
                        border: `1px solid ${active ? 'rgba(212,184,122,0.2)' : '#3d3d3d'}`,
                        borderRadius: 2,
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      {/* Checkbox customizado */}
                      <div
                        onClick={() => toggleSegment(opt.key)}
                        style={{
                          width: 16,
                          height: 16,
                          border: `1px solid ${active ? '#d4b87a' : '#3a3a3a'}`,
                          borderRadius: 2,
                          background: active ? '#d4b87a' : 'transparent',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {active && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>

                      <div onClick={() => toggleSegment(opt.key)} style={{ flex: 1 }}>
                        <span style={{
                          fontSize: 12,
                          fontFamily: '"JetBrains Mono", monospace',
                          color: active ? '#d4b87a' : '#a0a0a0',
                          fontWeight: active ? 600 : 400,
                          letterSpacing: '0.05em',
                        }}>
                          {opt.label}
                        </span>
                        <span style={{
                          marginLeft: 10,
                          fontSize: 11,
                          fontFamily: 'system-ui',
                          color: '#8a8a8a',
                        }}>
                          {opt.description}
                        </span>
                      </div>
                    </label>
                  )
                })}
              </div>

              {activeSegments.length > 0 && (
                <p style={{
                  marginTop: 10,
                  fontSize: 11,
                  fontFamily: '"JetBrains Mono", monospace',
                  color: '#4a7c59',
                }}>
                  Ativo: {activeSegments.join(', ')}
                </p>
              )}
            </div>
          </div>

          {/* ── Campos numéricos ──────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {FIELD_META.map((field, i) => (
              <React.Fragment key={field.key}>
                {field.section && (
                  <div style={{
                    padding: '10px 20px 6px',
                    background: '#1f1f1f',
                    borderBottom: '1px solid #2e2e2e',
                    borderTop: '1px solid #3d3d3d',
                  }}>
                    <p style={{
                      color: '#8a8a8a', fontSize: 10, letterSpacing: '0.12em',
                      fontFamily: 'system-ui', margin: 0,
                    }}>
                      {field.section}
                    </p>
                  </div>
                )}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  background: '#1f1f1f',
                  borderBottom: i < FIELD_META.length - 1 ? '1px solid #2e2e2e' : 'none',
                  gap: 16,
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{
                      color: '#a0a0a0', fontSize: 11, letterSpacing: '0.1em',
                      fontFamily: 'system-ui', margin: '0 0 3px',
                    }}>
                      {field.label}
                    </p>
                    <p style={{ color: '#8a8a8a', fontSize: 11, fontFamily: 'system-ui', margin: 0 }}>
                      {field.description}
                    </p>
                  </div>
                  <input
                    type={field.type}
                    step={field.step}
                    min={field.min}
                    max={field.max}
                    value={config[field.key]}
                    onChange={e => setConfig(prev => ({ ...prev, [field.key]: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* ── Botão salvar ─────────────────────────────────────────────── */}
          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                background: saving ? '#2a2a2a' : '#d4b87a',
                color: saving ? '#a0a0a0' : '#1a1a1a',
                border: 'none',
                padding: '9px 24px',
                fontSize: 11,
                letterSpacing: '0.15em',
                fontFamily: 'system-ui',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                borderRadius: 2,
              }}
            >
              {saving ? 'SALVANDO...' : 'SALVAR CONFIGURAÇÕES'}
            </button>
            {saved && (
              <span style={{ color: '#4a7c59', fontSize: 12, fontFamily: 'system-ui' }}>
                Configurações salvas.
              </span>
            )}
            {error && (
              <span style={{ color: '#8c3f3f', fontSize: 12, fontFamily: 'system-ui' }}>
                {error}
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  )
}
