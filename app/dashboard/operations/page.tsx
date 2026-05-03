'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import type { Operation } from '@/lib/supabase'
import CloseModal from '@/components/CloseModal'
import { fmtHedge, signalLabel, fmtDateBRT } from '@/lib/utils'

const RatioChart = dynamic(() => import('@/components/RatioChart'), { ssr: false })

// ─── OperationCard ────────────────────────────────────────────────────────────

interface CardProps {
  op: Operation
  onEncerrar: (op: Operation) => void
}

function OperationCard({ op, onEncerrar }: CardProps) {
  const [pricesA, setPricesA]   = useState<number[]>([])
  const [pricesB, setPricesB]   = useState<number[]>([])
  const [dates,   setDates]     = useState<string[]>([])
  const [loadingChart, setLoadingChart] = useState(true)

  useEffect(() => {
    async function loadHistory() {
      try {
        const res  = await fetch(`/api/history?tickers=${op.ticker_a},${op.ticker_b}`)
        if (!res.ok) return
        const json = await res.json()
        if (!json.pricesA || !json.pricesB || !json.dates) return
        setPricesA(json.pricesA)
        setPricesB(json.pricesB)
        setDates(json.dates)
      } catch {
        // silently fail — chart won't render
      } finally {
        setLoadingChart(false)
      }
    }
    loadHistory()
  }, [op.ticker_a, op.ticker_b])

  // Compute current ratio from last prices
  const currentRatio = (pricesA.length > 0 && pricesB.length > 0 && pricesB[pricesB.length - 1] > 0)
    ? pricesA[pricesA.length - 1] / pricesB[pricesB.length - 1]
    : null

  // Live P&L
  let livePnl: number | null = null
  if (currentRatio != null && op.entry_ratio > 0) {
    if (op.signal === 'long_spread') {
      livePnl = (currentRatio - op.entry_ratio) / op.entry_ratio * 100
    } else {
      livePnl = (op.entry_ratio - currentRatio) / op.entry_ratio * 100
    }
    livePnl = Math.round(livePnl * 10000) / 10000
  }

  const signalColor = op.signal === 'long_spread' ? '#4a9c6a' : '#c0504a'
  const pnlColor    = livePnl == null ? '#a0a0a0' : livePnl >= 0 ? '#4a9c6a' : '#c0504a'

  return (
    <div style={{
      background: '#1f1f1f',
      border: '1px solid #3d3d3d',
      borderRadius: 2,
      marginBottom: 16,
    }}>
      {/* Card header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: '1px solid #2e2e2e', flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 14, color: '#f5f5f5', fontWeight: 700 }}>
            {op.ticker_a}
          </span>
          <span style={{ color: '#8a8a8a' }}>/</span>
          <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 14, color: '#a0a0a0', fontWeight: 700 }}>
            {op.ticker_b}
          </span>
          <span style={{
            fontSize: 9, letterSpacing: '0.1em', fontFamily: 'system-ui',
            color: signalColor, padding: '2px 8px',
            border: `1px solid ${signalColor}44`, borderRadius: 2,
          }}>
            {signalLabel(op.signal)}
          </span>
          <span style={{ fontSize: 9, color: '#8a8a8a', fontFamily: 'system-ui' }}>
            Hedge {fmtHedge(op.hedge_ratio)}
          </span>
        </div>
        <button
          onClick={() => onEncerrar(op)}
          style={{
            background: 'none',
            border: '1px solid #c0504a',
            color: '#c0504a',
            fontSize: 10,
            letterSpacing: '0.1em',
            fontFamily: 'system-ui',
            padding: '5px 12px',
            cursor: 'pointer',
            borderRadius: 2,
          }}
        >
          ENCERRAR OPERAÇÃO
        </button>
      </div>

      {/* Metrics row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
        gap: '8px 20px',
        padding: '12px 16px',
        borderBottom: '1px solid #2e2e2e',
      }}>
        {[
          { label: 'ENTRADA',     value: op.entry_ratio.toFixed(4),                        color: signalColor },
          { label: 'ALVO',        value: op.target_ratio?.toFixed(4) ?? '—',               color: '#d8d8d8' },
          { label: 'STOP',        value: op.stop_ratio?.toFixed(4) ?? '—',                 color: op.signal === 'long_spread' ? '#c0504a' : '#4a9c6a' },
          { label: 'RATIO ATUAL', value: currentRatio?.toFixed(4) ?? '—',                  color: '#f5f5f5' },
          { label: 'P&L ATUAL',   value: livePnl != null ? `${livePnl >= 0 ? '+' : ''}${livePnl.toFixed(2)}%` : '—', color: pnlColor },
          { label: 'DATA ENTRADA', value: fmtDateBRT(op.entry_at),                         color: '#8a8a8a' },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <p style={{ fontSize: 9, letterSpacing: '0.1em', fontFamily: 'system-ui', color: '#8a8a8a', margin: '0 0 2px', textTransform: 'uppercase' }}>
              {label}
            </p>
            <p style={{ fontSize: 12, fontFamily: '"JetBrains Mono", monospace', color, margin: 0, fontWeight: 600 }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Chart */}
      {loadingChart ? (
        <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 11, color: '#8a8a8a', fontFamily: 'system-ui' }}>Carregando gráfico...</span>
        </div>
      ) : pricesA.length >= 10 ? (
        <RatioChart
          pricesA={pricesA}
          pricesB={pricesB}
          dates={dates}
          tickerA={op.ticker_a}
          tickerB={op.ticker_b}
          signal={op.signal}
          entryRatio={op.entry_ratio}
          entryLabel={`ENTRADA  ${op.entry_ratio.toFixed(4)}`}
        />
      ) : (
        <div style={{ padding: '16px', color: '#8a8a8a', fontSize: 11, fontFamily: 'system-ui' }}>
          Histórico insuficiente para renderizar gráfico.
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OperationsPage() {
  const [operations, setOperations] = useState<Operation[]>([])
  const [loading,    setLoading]    = useState(true)
  const [closing,    setClosing]    = useState<Operation | null>(null)

  const load = useCallback(async () => {
    try {
      const res  = await fetch('/api/express/operations', {
        method: 'get',
        credentials: 'include',
      }) //
      const data = await res.json()
      console.log(res);
      const numFields = ['hedge_ratio','entry_ratio','target_ratio','stop_ratio','entry_price_a','entry_price_b','entry_qty_a','entry_qty_b','exit_price_a','exit_price_b','exit_ratio','pnl_pct'] as const
      const normalized = (data as any[]).map(o => {
        const n: any = { ...o }
        for (const k of numFields) if (n[k] != null) n[k] = Number(n[k])
        return n as Operation
      })
      setOperations(normalized.filter(o => o.status === 'open'))
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function handleCloseSuccess() {
    setClosing(null)
    load()
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 13, letterSpacing: '0.1em', color: '#f5f5f5', fontFamily: 'system-ui', margin: '0 0 4px', fontWeight: 500 }}>
          OPERAÇÕES ABERTAS
        </h1>
        <p style={{ color: '#8a8a8a', fontSize: 11, fontFamily: 'system-ui', margin: 0 }}>
          Operações registradas manualmente. Use o scanner para identificar novas entradas.
        </p>
      </div>

      {loading ? (
        <div>
          {[1, 2].map(i => (
            <div key={i} style={{ height: 200, background: '#1f1f1f', border: '1px solid #3d3d3d', borderRadius: 2, marginBottom: 16 }} />
          ))}
        </div>
      ) : operations.length === 0 ? (
        <div style={{
          background: '#1f1f1f', border: '1px solid #3d3d3d', borderRadius: 2,
          padding: '48px 0', textAlign: 'center',
          color: '#8a8a8a', fontSize: 11, fontFamily: 'system-ui',
        }}>
          Nenhuma operação aberta. Acesse o scanner e clique em EXECUTAR para registrar uma entrada.
        </div>
      ) : (
        operations.map(op => (
          <OperationCard
            key={op.id}
            op={op}
            onEncerrar={setClosing}
          />
        ))
      )}

      {closing && (
        <CloseModal
          operation={closing}
          onClose={() => setClosing(null)}
          onSuccess={handleCloseSuccess}
        />
      )}
    </div>
  )
}
