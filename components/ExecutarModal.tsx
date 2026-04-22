'use client'

import { useState, useEffect } from 'react'
import type { CointegratedPair } from '@/lib/supabase'
import { fmtHedge, signalLabel } from '@/lib/utils'

interface Props {
  pair: CointegratedPair
  onClose: () => void
  onSuccess: () => void
}

const labelStyle: React.CSSProperties = {
  fontSize: 9,
  letterSpacing: '0.1em',
  fontFamily: 'system-ui',
  color: '#8a8a8a',
  textTransform: 'uppercase',
  margin: '0 0 3px',
}

const valueStyle: React.CSSProperties = {
  fontSize: 13,
  fontFamily: '"JetBrains Mono", monospace',
  color: '#f5f5f5',
  margin: 0,
  fontWeight: 600,
}

const inputStyle: React.CSSProperties = {
  background: '#2a2a2a',
  border: '1px solid #2a2a2a',
  color: '#f5f5f5',
  fontSize: 13,
  fontFamily: '"JetBrains Mono", monospace',
  padding: '7px 10px',
  borderRadius: 2,
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
}

const LOOKBACK = 60

export default function ExecutarModal({ pair, onClose, onSuccess }: Props) {
  const [priceA, setPriceA]   = useState(String(pair.price_a ?? ''))
  const [priceB, setPriceB]   = useState(String(pair.price_b ?? ''))
  const [qtyA,   setQtyA]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [ratioStats, setRatioStats] = useState<{ mean: number; std: number } | null>(null)

  // Fetch price history to compute real ratio mean/std
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`/api/history?tickers=${pair.ticker_a},${pair.ticker_b}`)
        if (!res.ok) return
        const data = await res.json()
        const pA: number[] = data.pricesA ?? []
        const pB: number[] = data.pricesB ?? []
        const valid: number[] = []
        for (let i = 0; i < pA.length; i++) {
          const a = pA[i], b = pB[i]
          if (a && b && b > 0) { const r = a / b; if (isFinite(r) && r > 0) valid.push(r) }
        }
        if (valid.length < 10) return
        const slice = valid.slice(-LOOKBACK)
        const mean  = slice.reduce((s, v) => s + v, 0) / slice.length
        const std   = Math.sqrt(slice.reduce((s, v) => s + (v - mean) ** 2, 0) / slice.length)
        setRatioStats({ mean, std })
      } catch { /* silently fail */ }
    }
    fetchStats()
  }, [pair.ticker_a, pair.ticker_b])

  const parsedPriceA = parseFloat(priceA)
  const parsedPriceB = parseFloat(priceB)
  const parsedQtyA   = parseFloat(qtyA)
  const hedge        = pair.hedge_ratio ?? 1

  const entryRatio = (isFinite(parsedPriceA) && isFinite(parsedPriceB) && parsedPriceB > 0)
    ? parsedPriceA / parsedPriceB : null

  // Qty B: casa o valor financeiro da perna A, arredondado para a centena acima.
  const qtyB = (isFinite(parsedQtyA) && isFinite(parsedPriceA) && isFinite(parsedPriceB) && parsedPriceB > 0)
    ? Math.ceil((parsedQtyA * parsedPriceA) / parsedPriceB / 100) * 100 : null

  const mean = ratioStats?.mean ?? 0
  const std  = ratioStats?.std  ?? 0

  const targetRatio = (ratioStats && mean > 0) ? mean : null

  // Direction: derived from entry ratio vs mean when prices are available,
  // falls back to DB signal otherwise.
  // long  → ratio below mean → buy A / sell B → expect ratio to RISE
  // short → ratio above mean → sell A / buy B → expect ratio to FALL
  const opDirection: 'long' | 'short' | null =
    (entryRatio != null && targetRatio != null)
      ? entryRatio < targetRatio ? 'long' : 'short'
      : pair.signal === 'long_spread'  ? 'long'
      : pair.signal === 'short_spread' ? 'short'
      : null

  const buyTicker  = opDirection === 'long'  ? pair.ticker_a : pair.ticker_b
  const sellTicker = opDirection === 'long'  ? pair.ticker_b : pair.ticker_a

  // Stop rule: 1/3 of potential (distance from entry to mean), ensuring R/R = 3:1.
  const stopRatio = (entryRatio != null && targetRatio != null && entryRatio > 0)
    ? (() => {
        const potential = Math.abs(targetRatio - entryRatio)
        return entryRatio < targetRatio
          ? entryRatio - potential / 3   // long: stop below entry
          : entryRatio + potential / 3   // short: stop above entry
      })()
    : null

  const gainPct = (entryRatio != null && targetRatio != null && entryRatio > 0)
    ? Math.abs(targetRatio - entryRatio) / entryRatio * 100 : null
  const riskPct = (entryRatio != null && stopRatio != null && entryRatio > 0)
    ? Math.abs(entryRatio - stopRatio) / entryRatio * 100 : null
  const rr = (gainPct != null && riskPct != null && riskPct > 0)
    ? gainPct / riskPct : null

  const signalColor = opDirection === 'long' ? '#4a9c6a' : opDirection === 'short' ? '#c0504a' : '#a0a0a0'

  async function handleConfirmar() {
    if (!entryRatio || !parsedQtyA || !isFinite(parsedPriceA) || !isFinite(parsedPriceB)) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/express/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({
          ticker_a:     pair.ticker_a,
          ticker_b:     pair.ticker_b,
          signal:       pair.signal,
          hedge_ratio:  hedge,
          entry_ratio:  Math.round(entryRatio * 1000000) / 1000000,
          target_ratio: targetRatio != null ? Math.round(targetRatio * 1000000) / 1000000 : null,
          stop_ratio:   stopRatio   != null ? Math.round(stopRatio   * 1000000) / 1000000 : null,
          entry_price_a: parsedPriceA,
          entry_price_b: parsedPriceB,
          entry_qty_a:   parsedQtyA,
          entry_qty_b:   qtyB ?? 0,
          pair_id:       pair.id,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao registrar operação.')
      onSuccess()
    } catch (e: any) {
      setError(e.message ?? 'Erro desconhecido.')
    } finally {
      setLoading(false)
    }
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#1f1f1f',
        border: '1px solid #3d3d3d',
        borderRadius: 2,
        width: '100%',
        maxWidth: 520,
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: 24,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 10, letterSpacing: '0.1em', fontFamily: 'system-ui', color: '#8a8a8a', margin: '0 0 4px' }}>
              REGISTRAR OPERAÇÃO
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 16, color: '#f5f5f5', fontWeight: 700 }}>
                {pair.ticker_a}
              </span>
              <span style={{ color: '#8a8a8a' }}>/</span>
              <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 16, color: '#a0a0a0', fontWeight: 700 }}>
                {pair.ticker_b}
              </span>
              <span style={{
                fontSize: 9, letterSpacing: '0.1em', fontFamily: 'system-ui',
                color: signalColor, padding: '2px 8px',
                border: `1px solid ${signalColor}44`, borderRadius: 2,
              }}>
                {signalLabel(pair.signal)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#8a8a8a', fontSize: 18, cursor: 'pointer', padding: 0, lineHeight: 1 }}
          >
            x
          </button>
        </div>

        {/* Info row */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
          <div>
            <p style={labelStyle}>SCORE</p>
            <p style={{ ...valueStyle, color: '#d4b87a' }}>{pair.score ?? '—'}</p>
          </div>
          <div>
            <p style={labelStyle}>HEDGE RATIO</p>
            <p style={valueStyle}>{fmtHedge(pair.hedge_ratio)}</p>
          </div>
          <div>
            <p style={labelStyle}>Z-SCORE</p>
            <p style={valueStyle}>{pair.z_score != null && !isNaN(Number(pair.z_score)) ? Number(pair.z_score).toFixed(2) : '—'}</p>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid #2e2e2e', marginBottom: 20 }} />

        {/* Price inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <p style={labelStyle}>PRECO {pair.ticker_a} *</p>
            <input
              type="number"
              step="0.01"
              value={priceA}
              onChange={e => setPriceA(e.target.value)}
              style={inputStyle}
              placeholder="0.00"
            />
          </div>
          <div>
            <p style={labelStyle}>PRECO {pair.ticker_b} *</p>
            <input
              type="number"
              step="0.01"
              value={priceB}
              onChange={e => setPriceB(e.target.value)}
              style={inputStyle}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Qty inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div>
            <p style={labelStyle}>
              QTD {pair.ticker_a}
              {opDirection && (
                <span style={{ marginLeft: 6, color: opDirection === 'long' ? '#4a9c6a' : '#c0504a' }}>
                  ({opDirection === 'long' ? 'COMPRA' : 'VENDE'}) *
                </span>
              )}
              {!opDirection && ' *'}
            </p>
            <input
              type="number"
              step="100"
              value={qtyA}
              onChange={e => setQtyA(e.target.value)}
              style={inputStyle}
              placeholder="100"
            />
          </div>
          <div>
            <p style={labelStyle}>
              QTD {pair.ticker_b}
              {opDirection && (
                <span style={{ marginLeft: 6, color: opDirection === 'long' ? '#c0504a' : '#4a9c6a' }}>
                  ({opDirection === 'long' ? 'VENDE' : 'COMPRA'})
                </span>
              )}
              {' '}— arredondado
            </p>
            <input
              type="number"
              readOnly
              value={qtyB != null && isFinite(qtyB) ? String(qtyB) : ''}
              style={{ ...inputStyle, color: '#8a8a8a', cursor: 'not-allowed' }}
              placeholder="—"
            />
          </div>
        </div>

        {/* Computed stats */}
        {entryRatio != null && (
          <>
            <div style={{ borderTop: '1px solid #2e2e2e', marginBottom: 16 }} />

            {/* Resumo da operação */}
            {opDirection && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 20,
                marginBottom: 16, padding: '10px 14px',
                background: '#1f1f1f', border: '1px solid #2e2e2e', borderRadius: 2,
                flexWrap: 'wrap',
              }}>
                <div>
                  <p style={labelStyle}>COMPRA</p>
                  <p style={{ ...valueStyle, color: '#4a9c6a' }}>{buyTicker}</p>
                </div>
                <div style={{ color: '#2a2a2a', fontSize: 18, alignSelf: 'center' }}>×</div>
                <div>
                  <p style={labelStyle}>VENDE</p>
                  <p style={{ ...valueStyle, color: '#c0504a' }}>{sellTicker}</p>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <p style={labelStyle}>RATIO {pair.ticker_a}/{pair.ticker_b} PRECISA</p>
                  <p style={{ ...valueStyle, color: signalColor }}>
                    {opDirection === 'long' ? '↑ SUBIR' : '↓ CAIR'}
                  </p>
                </div>
              </div>
            )}

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: '10px 20px',
              marginBottom: 16,
            }}>
              <div>
                <p style={labelStyle}>RATIO ENTRADA ({pair.ticker_a}/{pair.ticker_b})</p>
                <p style={{ ...valueStyle, color: signalColor }}>{entryRatio.toFixed(4)}</p>
              </div>
              {targetRatio != null && (
                <div>
                  <p style={labelStyle}>ALVO — RATIO MÉDIO</p>
                  <p style={{ ...valueStyle, color: '#d8d8d8' }}>{targetRatio.toFixed(4)}</p>
                </div>
              )}
              {stopRatio != null && entryRatio != null && targetRatio != null && (
                <div>
                  <p style={labelStyle}>STOP (1/3 pot.)</p>
                  <p style={{ ...valueStyle, color: '#c0504a' }}>
                    {stopRatio.toFixed(4)}
                  </p>
                </div>
              )}
              {gainPct != null && (
                <div>
                  <p style={labelStyle}>POTENCIAL</p>
                  <p style={{ ...valueStyle, color: '#4a9c6a' }}>+{gainPct.toFixed(2)}%</p>
                </div>
              )}
              {riskPct != null && (
                <div>
                  <p style={labelStyle}>RISCO</p>
                  <p style={{ ...valueStyle, color: '#c0504a' }}>-{riskPct.toFixed(2)}%</p>
                </div>
              )}
              {rr != null && (
                <div>
                  <p style={labelStyle}>R/R</p>
                  <p style={{
                    ...valueStyle,
                    color: rr >= 2 ? '#4a9c6a' : rr >= 1 ? '#d4b87a' : '#c0504a',
                  }}>
                    1 : {rr.toFixed(1)}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Error */}
        {error && (
          <p style={{ color: '#c0504a', fontSize: 11, fontFamily: 'system-ui', margin: '0 0 16px' }}>
            {error}
          </p>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'none',
              border: '1px solid #3d3d3d',
              color: '#a0a0a0',
              fontSize: 11,
              letterSpacing: '0.1em',
              fontFamily: 'system-ui',
              padding: '8px 16px',
              cursor: 'pointer',
              borderRadius: 2,
            }}
          >
            CANCELAR
          </button>
          <button
            onClick={handleConfirmar}
            disabled={loading || !entryRatio || !isFinite(parsedQtyA)}
            style={{
              background: 'none',
              border: '1px solid #d4b87a',
              color: '#d4b87a',
              fontSize: 11,
              letterSpacing: '0.1em',
              fontFamily: 'system-ui',
              padding: '8px 20px',
              cursor: (loading || !entryRatio || !isFinite(parsedQtyA)) ? 'not-allowed' : 'pointer',
              borderRadius: 2,
              opacity: (loading || !entryRatio || !isFinite(parsedQtyA)) ? 0.5 : 1,
            }}
          >
            {loading ? 'REGISTRANDO...' : 'CONFIRMAR'}
          </button>
        </div>
      </div>
    </div>
  )
}
