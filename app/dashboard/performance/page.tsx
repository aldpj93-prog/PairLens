'use client'

import { useEffect, useState } from 'react'
import type { Operation, ScanRun } from '@/lib/supabase'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import MetricCard from '@/components/MetricCard'
import { fmtPct, fmtDays, fmtDateBRT, signalLabel } from '@/lib/utils'
import dynamic from 'next/dynamic'

const ScanHistoryChart = dynamic(() => import('@/components/ScanHistoryChart'), { ssr: false })

export default function PerformancePage() {
  const [closed,  setClosed]  = useState<Operation[]>([])
  const [runs,    setRuns]    = useState<ScanRun[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [opsRes, supabase] = [
          fetch('/api/operations'),
          createBrowserSupabaseClient(),
        ]
        const [opsData, runsRes] = await Promise.all([
          opsRes.then(r => r.json()),
          supabase
            .from('scan_runs')
            .select('*')
            .eq('status', 'completed')
            .order('triggered_at', { ascending: false })
            .limit(30),
        ])
        const allOps = opsData as Operation[]
        setClosed(allOps.filter(o => o.status === 'closed'))
        if (runsRes.data) setRuns(runsRes.data as ScanRun[])
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Derived metrics
  const total   = closed.length
  const wins    = closed.filter(o => (o.pnl_pct ?? 0) > 0).length
  const winRate = total > 0 ? (wins / total) * 100 : 0
  const avgPnl  = total > 0 ? closed.reduce((s, o) => s + (o.pnl_pct ?? 0), 0) / total : 0

  // Duration from entry_at to exit_at
  const avgDur = total > 0
    ? closed.reduce((s, o) => {
        if (!o.exit_at || !o.entry_at) return s
        return s + (new Date(o.exit_at).getTime() - new Date(o.entry_at).getTime()) / 86400000
      }, 0) / total
    : 0

  const best  = [...closed].sort((a, b) => (b.pnl_pct ?? 0) - (a.pnl_pct ?? 0))[0]
  const worst = [...closed].sort((a, b) => (a.pnl_pct ?? 0) - (b.pnl_pct ?? 0))[0]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 13, letterSpacing: '0.1em', color: '#e2e2e2', fontFamily: 'system-ui', margin: '0 0 4px', fontWeight: 500 }}>
          PERFORMANCE
        </h1>
        <p style={{ color: '#4a4a4a', fontSize: 11, fontFamily: 'system-ui', margin: 0 }}>
          Historico de operacoes encerradas.
        </p>
      </div>

      {loading ? (
        <div>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 48, background: '#111111', marginBottom: 8, borderRadius: 2 }} />
          ))}
        </div>
      ) : (
        <>
          {/* Metric cards */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
            <MetricCard label="OPERACOES ENCERRADAS" value={total} />
            <MetricCard
              label="WIN RATE"
              value={total > 0 ? `${winRate.toFixed(1)}%` : '—'}
              accent={winRate >= 50}
            />
            <MetricCard
              label="P&L MEDIO"
              value={total > 0 ? fmtPct(avgPnl) : '—'}
              accent={avgPnl > 0}
            />
            <MetricCard label="DURACAO MEDIA" value={total > 0 ? fmtDays(avgDur) : '—'} />
            <MetricCard
              label="MELHOR TRADE"
              value={best ? fmtPct(best.pnl_pct) : '—'}
              sub={best ? `${best.ticker_a}/${best.ticker_b}` : undefined}
              accent
            />
            <MetricCard
              label="PIOR TRADE"
              value={worst ? fmtPct(worst.pnl_pct) : '—'}
              sub={worst ? `${worst.ticker_a}/${worst.ticker_b}` : undefined}
            />
          </div>

          {/* Closed operations table */}
          {closed.length > 0 && (
            <div style={{ background: '#111111', border: '1px solid #252525', borderRadius: 2, marginBottom: 16, overflowX: 'auto' }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid #1e1e1e' }}>
                <p style={{ color: '#4a4a4a', fontSize: 10, letterSpacing: '0.1em', fontFamily: 'system-ui', margin: 0 }}>
                  HISTORICO DE OPERACOES
                </p>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['#', 'PAR', 'DIRECAO', 'ENTRADA', 'SAIDA', 'P&L', 'ENCERRAMENTO'].map(h => (
                      <th
                        key={h}
                        style={{
                          textAlign: 'left',
                          padding: '8px 12px',
                          fontSize: 9,
                          letterSpacing: '0.1em',
                          fontFamily: 'system-ui',
                          color: '#4a4a4a',
                          borderBottom: '1px solid #1e1e1e',
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {closed.map((op, idx) => {
                    const pnlColor = (op.pnl_pct ?? 0) >= 0 ? '#4a9c6a' : '#c0504a'
                    const signalColor = op.signal === 'long_spread' ? '#4a7c59' : '#8c3f3f'
                    return (
                      <tr
                        key={op.id}
                        style={{ borderBottom: '1px solid #191919' }}
                      >
                        <td style={{ padding: '8px 12px', fontSize: 11, fontFamily: '"JetBrains Mono", monospace', color: '#4a4a4a' }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: 12, fontFamily: '"JetBrains Mono", monospace', color: '#e2e2e2', fontWeight: 600 }}>
                            {op.ticker_a}
                          </span>
                          <span style={{ color: '#4a4a4a', margin: '0 4px' }}>/</span>
                          <span style={{ fontSize: 12, fontFamily: '"JetBrains Mono", monospace', color: '#7a7a7a' }}>
                            {op.ticker_b}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ fontSize: 11, fontFamily: 'system-ui', color: signalColor, fontWeight: 600 }}>
                            {signalLabel(op.signal)}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: 12, fontFamily: '"JetBrains Mono", monospace', color: '#e2e2e2' }}>
                          {op.entry_ratio.toFixed(4)}
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: 12, fontFamily: '"JetBrains Mono", monospace', color: '#e2e2e2' }}>
                          {op.exit_ratio?.toFixed(4) ?? '—'}
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: 12, fontFamily: '"JetBrains Mono", monospace', color: pnlColor, fontWeight: 600 }}>
                          {op.pnl_pct != null
                            ? `${op.pnl_pct >= 0 ? '+' : ''}${op.pnl_pct.toFixed(2)}%`
                            : '—'}
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: 11, fontFamily: '"JetBrains Mono", monospace', color: '#4a4a4a', whiteSpace: 'nowrap' }}>
                          {fmtDateBRT(op.exit_at)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Scan history chart */}
          {runs.length > 0 && (
            <div style={{ background: '#111111', border: '1px solid #252525', borderRadius: 2, padding: '16px 0 8px' }}>
              <p style={{ color: '#4a4a4a', fontSize: 10, letterSpacing: '0.1em', fontFamily: 'system-ui', paddingLeft: 20, marginBottom: 8 }}>
                HISTORICO DE SCANS — PARES ENCONTRADOS
              </p>
              <ScanHistoryChart runs={runs} />
            </div>
          )}

          {closed.length === 0 && (
            <div style={{
              background: '#111111', border: '1px solid #252525', borderRadius: 2,
              padding: '48px 0', textAlign: 'center',
              color: '#4a4a4a', fontSize: 11, fontFamily: 'system-ui',
            }}>
              Nenhuma operacao encerrada ainda.
            </div>
          )}
        </>
      )}
    </div>
  )
}
