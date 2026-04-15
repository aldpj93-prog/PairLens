'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { OperationLog } from '@/lib/supabase'
import { fmtDateBRT } from '@/lib/utils'

interface Props {
  operations: OperationLog[]
}

export default function CumulativePnlChart({ operations }: Props) {
  let cumulative = 0
  const data = operations
    .filter(o => o.exit_at && o.pnl_pct != null)
    .sort((a, b) => new Date(a.exit_at!).getTime() - new Date(b.exit_at!).getTime())
    .map(o => {
      cumulative += o.pnl_pct ?? 0
      return {
        date: fmtDateBRT(o.exit_at),
        pnl: parseFloat(cumulative.toFixed(4)),
      }
    })

  if (data.length === 0) {
    return (
      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#4a4a4a', fontSize: 12, fontFamily: 'system-ui' }}>No closed operations.</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 24, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: '#4a4a4a', fontFamily: 'JetBrains Mono' }}
          tickLine={false}
          axisLine={{ stroke: '#333333' }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#4a4a4a', fontFamily: 'JetBrains Mono' }}
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={(v) => `${v.toFixed(1)}%`}
        />
        <Tooltip
          contentStyle={{
            background: '#111111',
            border: '1px solid #252525',
            borderRadius: 2,
            fontSize: 11,
            fontFamily: 'JetBrains Mono, monospace',
            color: '#e2e2e2',
          }}
          formatter={(v: number) => [`${v.toFixed(4)}%`, 'Cumulative P&L']}
        />
        <ReferenceLine y={0} stroke="#333333" strokeDasharray="2 2" strokeWidth={0.5} />
        <Line
          type="linear"
          dataKey="pnl"
          stroke="#c8a96e"
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
