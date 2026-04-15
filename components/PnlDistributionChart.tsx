'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts'
import type { OperationLog } from '@/lib/supabase'

interface Props {
  operations: OperationLog[]
}

const BUCKETS = [
  { label: '<-5%',       min: -Infinity, max: -5 },
  { label: '-5 to -2%',  min: -5,        max: -2 },
  { label: '-2 to 0%',   min: -2,        max:  0 },
  { label: '0 to 2%',    min:  0,        max:  2 },
  { label: '2 to 5%',    min:  2,        max:  5 },
  { label: '>5%',        min:  5,        max: Infinity },
]

export default function PnlDistributionChart({ operations }: Props) {
  const data = BUCKETS.map(b => ({
    label: b.label,
    count: operations.filter(o => {
      const p = o.pnl_pct ?? 0
      return p >= b.min && p < b.max
    }).length,
    positive: b.min >= 0,
  }))

  if (operations.length === 0) {
    return (
      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#4a4a4a', fontSize: 12, fontFamily: 'system-ui' }}>No closed operations.</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 24, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: '#4a4a4a', fontFamily: 'JetBrains Mono' }}
          tickLine={false}
          axisLine={{ stroke: '#333333' }}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#4a4a4a', fontFamily: 'JetBrains Mono' }}
          tickLine={false}
          axisLine={false}
          width={32}
          allowDecimals={false}
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
          formatter={(v: number) => [v, 'trades']}
        />
        <Bar dataKey="count" isAnimationActive={false}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.positive ? '#4a7c59' : '#8c3f3f'}
              opacity={0.85}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
