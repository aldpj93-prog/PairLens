'use client'

import { useState, useEffect } from 'react'
import type { Operation } from '@/lib/supabase'
import { signalLabel } from '@/lib/utils'

interface Props {
  operation: Operation
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

export default function CloseModal({ operation: op, onClose, onSuccess }: Props) {
  const [exitPriceA, setExitPriceA] = useState('')
  const [exitPriceB, setExitPriceB] = useState('')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const parsedExitA = parseFloat(exitPriceA)
  const parsedExitB = parseFloat(exitPriceB)

  const exitRatio = (isFinite(parsedExitA) && isFinite(parsedExitB) && parsedExitB > 0)
    ? parsedExitA / parsedExitB : null

  let pnlPct: number | null = null
  if (exitRatio != null && op.entry_ratio > 0) {
    if (op.signal === 'long_spread') {
      pnlPct = (exitRatio - op.entry_ratio) / op.entry_ratio * 100
    } else {
      pnlPct = (op.entry_ratio - exitRatio) / op.entry_ratio * 100
    }
    pnlPct = Math.round(pnlPct * 10000) / 10000
  }

  const signalColor = op.signal === 'long_spread' ? '#4a9c6a' : '#c0504a'
  const pnlColor    = pnlPct == null ? '#a0a0a0' : pnlPct >= 0 ? '#4a9c6a' : '#c0504a'

  async function handleConfirmar() {
    if (!isFinite(parsedExitA) || !isFinite(parsedExitB)) {
      setError('Preencha os preços de saída.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/operations/${op.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exit_price_a: parsedExitA, exit_price_b: parsedExitB }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao encerrar operação.')
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
        maxWidth: 460,
        padding: 24,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 10, letterSpacing: '0.1em', fontFamily: 'system-ui', color: '#8a8a8a', margin: '0 0 4px' }}>
              ENCERRAR OPERACAO
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 16, color: '#f5f5f5', fontWeight: 700 }}>
                {op.ticker_a}
              </span>
              <span style={{ color: '#8a8a8a' }}>/</span>
              <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 16, color: '#a0a0a0', fontWeight: 700 }}>
                {op.ticker_b}
              </span>
              <span style={{
                fontSize: 9, letterSpacing: '0.1em', fontFamily: 'system-ui',
                color: signalColor, padding: '2px 8px',
                border: `1px solid ${signalColor}44`, borderRadius: 2,
              }}>
                {signalLabel(op.signal)}
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

        {/* Entry details */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
          <div>
            <p style={labelStyle}>RATIO ENTRADA</p>
            <p style={valueStyle}>{op.entry_ratio.toFixed(4)}</p>
          </div>
          <div>
            <p style={labelStyle}>PRECO A ENTRADA</p>
            <p style={valueStyle}>{op.entry_price_a.toFixed(2)}</p>
          </div>
          <div>
            <p style={labelStyle}>PRECO B ENTRADA</p>
            <p style={valueStyle}>{op.entry_price_b.toFixed(2)}</p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #2e2e2e', marginBottom: 20 }} />

        {/* Exit price inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div>
            <p style={labelStyle}>PRECO {op.ticker_a} SAIDA *</p>
            <input
              type="number"
              step="0.01"
              value={exitPriceA}
              onChange={e => setExitPriceA(e.target.value)}
              style={inputStyle}
              placeholder="0.00"
              autoFocus
            />
          </div>
          <div>
            <p style={labelStyle}>PRECO {op.ticker_b} SAIDA *</p>
            <input
              type="number"
              step="0.01"
              value={exitPriceB}
              onChange={e => setExitPriceB(e.target.value)}
              style={inputStyle}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Computed exit stats */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
          <div>
            <p style={labelStyle}>RATIO SAIDA</p>
            <p style={valueStyle}>{exitRatio != null ? exitRatio.toFixed(4) : '—'}</p>
          </div>
          <div>
            <p style={labelStyle}>P&amp;L ESTIMADO</p>
            <p style={{ ...valueStyle, color: pnlColor, fontSize: 15 }}>
              {pnlPct != null
                ? `${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%`
                : '—'}
            </p>
          </div>
        </div>

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
            disabled={loading || exitRatio == null}
            style={{
              background: 'none',
              border: '1px solid #d4b87a',
              color: '#d4b87a',
              fontSize: 11,
              letterSpacing: '0.1em',
              fontFamily: 'system-ui',
              padding: '8px 20px',
              cursor: (loading || exitRatio == null) ? 'not-allowed' : 'pointer',
              borderRadius: 2,
              opacity: (loading || exitRatio == null) ? 0.5 : 1,
            }}
          >
            {loading ? 'ENCERRANDO...' : 'CONFIRMAR'}
          </button>
        </div>
      </div>
    </div>
  )
}
