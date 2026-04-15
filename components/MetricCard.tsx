interface MetricCardProps {
  label: string
  value: string | number
  accent?: boolean
  sub?: string
}

export default function MetricCard({ label, value, accent, sub }: MetricCardProps) {
  return (
    <div
      style={{
        background: '#111111',
        border: '1px solid #252525',
        padding: '16px 20px',
        minWidth: 140,
        flex: 1,
        borderRadius: 2,
      }}
    >
      <p
        style={{
          color: '#4a4a4a',
          fontSize: 10,
          letterSpacing: '0.1em',
          fontFamily: 'system-ui',
          margin: '0 0 8px',
        }}
      >
        {label}
      </p>
      <p
        style={{
          color: accent ? '#c8a96e' : '#e2e2e2',
          fontSize: 24,
          fontFamily: '"JetBrains Mono", monospace',
          fontWeight: 500,
          margin: 0,
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      {sub && (
        <p style={{ color: '#4a4a4a', fontSize: 11, marginTop: 4, fontFamily: 'system-ui' }}>
          {sub}
        </p>
      )}
    </div>
  )
}
