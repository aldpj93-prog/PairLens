'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { ScanRun } from '@/lib/supabase'
import { fmtDateBRT } from '@/lib/utils'

interface Props {
  runs: ScanRun[]
}

export default function ScanHistoryChart({ runs }: Props) {
  const data = [...runs]
    .sort((a, b) => new Date(a.triggered_at).getTime() - new Date(b.triggered_at).getTime())
    .map(r => ({
      date: fmtDateBRT(r.triggered_at),
      pairs: r.pairs_found ?? 0,
    }))

  if (data.length === 0) {
    return (
      <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#8a8a8a', fontSize: 12, fontFamily: 'system-ui' }}>No scan history.</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 24, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 9, fill: '#8a8a8a', fontFamily: 'JetBrains Mono' }}
          tickLine={false}
          axisLine={{ stroke: '#4a4a4a' }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#8a8a8a', fontFamily: 'JetBrains Mono' }}
          tickLine={false}
          axisLine={false}
          width={32}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: '#1f1f1f',
            border: '1px solid #3d3d3d',
            borderRadius: 2,
            fontSize: 11,
            fontFamily: 'JetBrains Mono, monospace',
            color: '#f5f5f5',
          }}
          formatter={(v: number) => [v, 'pairs found']}
        />
        <Bar dataKey="pairs" fill="#5a5a6a" isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  )
}
