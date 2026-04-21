'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface Props {
  residuals: number[]
  dates: string[]
}

const CHART_STYLE = {
  background: '#1f1f1f',
  border: '1px solid #2e2e2e',
  padding: '12px 0 8px',
  borderRadius: 2,
}

export default function PriceRatioChart({ residuals, dates }: Props) {
  const data = residuals.map((r, i) => ({
    date: dates[i] ?? String(i),
    spread: parseFloat(r.toFixed(4)),
  }))

  return (
    <div style={CHART_STYLE}>
      <p style={{
        color: '#8a8a8a',
        fontSize: 10,
        letterSpacing: '0.1em',
        fontFamily: 'system-ui',
        paddingLeft: 16,
        marginBottom: 8,
      }}>
        SPREAD SERIES (A - β·B)
      </p>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#8a8a8a', fontFamily: 'JetBrains Mono' }}
            tickLine={false}
            axisLine={{ stroke: '#4a4a4a' }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#8a8a8a', fontFamily: 'JetBrains Mono' }}
            tickLine={false}
            axisLine={false}
            width={60}
            tickFormatter={(v) => v.toFixed(2)}
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
            labelStyle={{ color: '#a0a0a0' }}
            formatter={(v: number) => [v.toFixed(4), 'spread']}
          />
          <Line
            type="linear"
            dataKey="spread"
            stroke="#a0a0a0"
            strokeWidth={1}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
