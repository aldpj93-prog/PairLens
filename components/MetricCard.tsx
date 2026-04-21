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
        background: '#1f1f1f',
        border: '1px solid #3d3d3d',
        padding: '16px 20px',
        minWidth: 140,
        flex: 1,
        borderRadius: 2,
      }}
    >
      <p
        style={{
          color: '#8a8a8a',
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
          color: accent ? '#d4b87a' : '#f5f5f5',
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
        <p style={{ color: '#8a8a8a', fontSize: 11, marginTop: 4, fontFamily: 'system-ui' }}>
          {sub}
        </p>
      )}
    </div>
  )
}
