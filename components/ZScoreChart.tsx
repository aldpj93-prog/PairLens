'use client'

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
} from 'recharts'

interface Props {
  zScores: number[]
  dates: string[]
  threshold?: number
  currentZScore?: number
}

export default function ZScoreChart({
  zScores,
  dates,
  threshold = 2.0,
  currentZScore,
}: Props) {
  // Split into colored segments: red (above threshold), green (below -threshold), gray otherwise
  // Build separate data arrays for each color
  const n = zScores.length

  interface DataPoint {
    date: string
    z: number | null
    zAbove: number | null
    zBelow: number | null
    zNeutral: number | null
  }

  const data: DataPoint[] = zScores.map((z, i) => {
    if (z == null || !isFinite(z)) return { date: dates[i] ?? String(i), z: null, zAbove: null, zBelow: null, zNeutral: null }
    const rounded = parseFloat(z.toFixed(4))
    return {
      date: dates[i] ?? String(i),
      z: rounded,
      zAbove:   z > threshold  ? rounded : null,
      zBelow:   z < -threshold ? rounded : null,
      zNeutral: z >= -threshold && z <= threshold ? rounded : null,
    }
  })

  // Current z dot
  const currentDot = currentZScore != null && isFinite(currentZScore)
    ? [{ date: dates[n - 1] ?? String(n - 1), z: parseFloat(currentZScore.toFixed(4)) }]
    : []

  return (
    <div style={{
      background: '#1f1f1f',
      border: '1px solid #2e2e2e',
      padding: '12px 0 8px',
      borderRadius: 2,
    }}>
      <p style={{
        color: '#8a8a8a',
        fontSize: 10,
        letterSpacing: '0.1em',
        fontFamily: 'system-ui',
        paddingLeft: 16,
        marginBottom: 8,
      }}>
        Z-SCORE (móvel de 60 dias)
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <ComposedChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
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
            width={48}
            tickFormatter={(v) => v.toFixed(1)}
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
            formatter={(v: number) => [v?.toFixed(4), 'z-score']}
          />

          {/* Reference lines */}
          <ReferenceLine y={0}           stroke="#4a4a4a" strokeDasharray="2 2" strokeWidth={0.5} />
          <ReferenceLine y={0.5}         stroke="#5a5a6a" strokeDasharray="2 4" strokeWidth={0.5} />
          <ReferenceLine y={-0.5}        stroke="#5a5a6a" strokeDasharray="2 4" strokeWidth={0.5} />
          <ReferenceLine y={threshold}   stroke="#8c3f3f" strokeDasharray="3 3" strokeWidth={0.5} label={{ value: `+${threshold}σ`, fill: '#8c3f3f', fontSize: 9, position: 'right' }} />
          <ReferenceLine y={-threshold}  stroke="#4a7c59" strokeDasharray="3 3" strokeWidth={0.5} label={{ value: `-${threshold}σ`, fill: '#4a7c59', fontSize: 9, position: 'right' }} />

          {/* Neutral segment */}
          <Line
            type="linear"
            dataKey="zNeutral"
            stroke="#5a5a6a"
            strokeWidth={1}
            dot={false}
            isAnimationActive={false}
            connectNulls={false}
          />
          {/* Above threshold — red */}
          <Line
            type="linear"
            dataKey="zAbove"
            stroke="#8c3f3f"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
            connectNulls={false}
          />
          {/* Below -threshold — green */}
          <Line
            type="linear"
            dataKey="zBelow"
            stroke="#4a7c59"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
            connectNulls={false}
          />

          {/* Current z dot */}
          {currentDot.length > 0 && (
            <Scatter
              data={currentDot}
              dataKey="z"
              fill="#d4b87a"
              shape={(props: any) => {
                const { cx, cy } = props
                return (
                  <g>
                    <circle cx={cx} cy={cy} r={4} fill="#d4b87a" />
                    <text x={cx + 7} y={cy + 4} fontSize={9} fill="#d4b87a" fontFamily="JetBrains Mono">
                      {currentDot[0]?.z?.toFixed(2)}
                    </text>
                  </g>
                )
              }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
