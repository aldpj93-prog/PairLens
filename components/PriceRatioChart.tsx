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
  background: '#111111',
  border: '1px solid #1e1e1e',
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
        color: '#4a4a4a',
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
            width={60}
            tickFormatter={(v) => v.toFixed(2)}
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
            labelStyle={{ color: '#7a7a7a' }}
            formatter={(v: number) => [v.toFixed(4), 'spread']}
          />
          <Line
            type="linear"
            dataKey="spread"
            stroke="#7a7a7a"
            strokeWidth={1}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
