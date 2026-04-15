'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface Props {
  pricesA: number[]
  pricesB: number[]
  dates: string[]
  tickerA: string
  tickerB: string
}

export default function NormalizedPricesChart({
  pricesA,
  pricesB,
  dates,
  tickerA,
  tickerB,
}: Props) {
  const baseA = pricesA[0] ?? 1
  const baseB = pricesB[0] ?? 1

  const data = pricesA.map((a, i) => ({
    date: dates[i] ?? String(i),
    [tickerA]: parseFloat(((a / baseA) * 100).toFixed(4)),
    [tickerB]: parseFloat(((pricesB[i] / baseB) * 100).toFixed(4)),
  }))

  return (
    <div style={{
      background: '#111111',
      border: '1px solid #1e1e1e',
      padding: '12px 0 8px',
      borderRadius: 2,
    }}>
      <p style={{
        color: '#4a4a4a',
        fontSize: 10,
        letterSpacing: '0.1em',
        fontFamily: 'system-ui',
        paddingLeft: 16,
        marginBottom: 8,
      }}>
        NORMALIZED PRICES (base = 100)
      </p>
      <ResponsiveContainer width="100%" height={180}>
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
            width={48}
            tickFormatter={(v) => v.toFixed(0)}
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
            formatter={(v: number) => [v.toFixed(2), '']}
          />
          <Legend
            wrapperStyle={{ fontSize: 10, fontFamily: 'system-ui', color: '#7a7a7a', paddingLeft: 16 }}
            formatter={(value) => `${value} (normalized)`}
          />
          <Line
            type="linear"
            dataKey={tickerA}
            stroke="#c8a96e"
            strokeWidth={1}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="linear"
            dataKey={tickerB}
            stroke="#5a5a6a"
            strokeWidth={1}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
