'use client'

import { useState } from 'react'
import type { OperationLog } from '@/lib/supabase'
import {
  fmt4,
  fmtPrice,
  fmtPct,
  fmtDateBRT,
  fmtDays,
  signalLabel,
} from '@/lib/utils'

interface Props {
  open: OperationLog[]
  closed: OperationLog[]
}

export default function OperationsTable({ open, closed }: Props) {
  const [tab, setTab] = useState<'open' | 'closed'>('open')

  const tabStyle = (active: boolean): React.CSSProperties => ({
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid #c8a96e' : '2px solid transparent',
    color: active ? '#e2e2e2' : '#4a4a4a',
    fontSize: 11,
    letterSpacing: '0.1em',
    fontFamily: 'system-ui',
    padding: '8px 0',
    marginRight: 24,
    cursor: 'pointer',
  })

  return (
    <div>
      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #1a1a1a', marginBottom: 16 }}>
        <button style={tabStyle(tab === 'open')} onClick={() => setTab('open')}>
          OPEN ({open.length})
        </button>
        <button style={tabStyle(tab === 'closed')} onClick={() => setTab('closed')}>
          CLOSED ({closed.length})
        </button>
      </div>

      {tab === 'open' && (
        <table>
          <thead>
            <tr>
              {['OPENED AT', 'PAIR', 'SIGNAL', 'ENTRY Z', 'ENTRY PRICE A', 'ENTRY PRICE B', 'DAYS OPEN', ''].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {open.length === 0 && (
              <tr>
                <td colSpan={8} style={{ color: '#4a4a4a', textAlign: 'center', padding: '32px 0' }}>
                  No open operations.
                </td>
              </tr>
            )}
            {open.map(op => {
              const daysOpen = (Date.now() - new Date(op.entry_at).getTime()) / 86400000
              return (
                <tr key={op.id}>
                  <td style={{ color: '#7a7a7a' }}>{fmtDateBRT(op.entry_at)}</td>
                  <td>
                    <span style={{ color: '#e2e2e2' }}>{op.ticker_a}</span>
                    <span style={{ color: '#4a4a4a', margin: '0 4px' }}>/</span>
                    <span style={{ color: '#7a7a7a' }}>{op.ticker_b}</span>
                  </td>
                  <td style={{ color: op.signal === 'long_spread' ? '#4a7c59' : '#8c3f3f', fontWeight: 600 }}>
                    {signalLabel(op.signal)}
                  </td>
                  <td>{fmt4(op.entry_z_score)}</td>
                  <td>{fmtPrice(op.entry_price_a)}</td>
                  <td>{fmtPrice(op.entry_price_b)}</td>
                  <td style={{ color: '#7a7a7a' }}>{daysOpen.toFixed(1)}d</td>
                  <td style={{ color: '#4a4a4a', fontSize: 10 }}>OPEN</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {tab === 'closed' && (
        <table>
          <thead>
            <tr>
              {['PAIR', 'SIGNAL', 'ENTRY Z', 'EXIT Z', 'ENTRY DATE', 'EXIT DATE', 'DURATION', 'P&L %', 'EXIT REASON'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {closed.length === 0 && (
              <tr>
                <td colSpan={9} style={{ color: '#4a4a4a', textAlign: 'center', padding: '32px 0' }}>
                  No closed operations.
                </td>
              </tr>
            )}
            {closed.map(op => (
              <tr key={op.id}>
                <td>
                  <span style={{ color: '#e2e2e2' }}>{op.ticker_a}</span>
                  <span style={{ color: '#4a4a4a', margin: '0 4px' }}>/</span>
                  <span style={{ color: '#7a7a7a' }}>{op.ticker_b}</span>
                </td>
                <td style={{ color: op.signal === 'long_spread' ? '#4a7c59' : '#8c3f3f', fontWeight: 600 }}>
                  {signalLabel(op.signal)}
                </td>
                <td>{fmt4(op.entry_z_score)}</td>
                <td>{fmt4(op.exit_z_score)}</td>
                <td style={{ color: '#7a7a7a' }}>{fmtDateBRT(op.entry_at)}</td>
                <td style={{ color: '#7a7a7a' }}>{fmtDateBRT(op.exit_at)}</td>
                <td>{fmtDays(op.duration_days)}</td>
                <td style={{ color: (op.pnl_pct ?? 0) >= 0 ? '#4a7c59' : '#8c3f3f', fontWeight: 600 }}>
                  {fmtPct(op.pnl_pct)}
                </td>
                <td style={{ color: '#4a4a4a', fontSize: 10, letterSpacing: '0.05em' }}>
                  {op.exit_reason?.replace('_', ' ').toUpperCase() ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
