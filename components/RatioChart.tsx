'use client'

import { useState } from 'react'
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
} from 'recharts'

interface Props {
  pricesA:     number[]
  pricesB:     number[]
  dates:       string[]
  tickerA:     string
  tickerB:     string
  signal?:     string   // 'long_spread' | 'short_spread' | 'neutral' — do banco
  threshold?:  number   // z-score de entrada/saída (default 2)
  lookback?:   number   // janela para cálculo de média/desvio (default 60)
  entryRatio?: number   // nível de entrada da operação (opcional)
  entryLabel?: string   // label customizado para a linha de entrada
}

const DISPLAY_OPTIONS = [30, 60, 90, 120, 150, 180, 210, 250]

// ── Tooltip customizado: só mostra ratio + Z-score ──────────────────────────
function RatioTooltip({ active, payload, label, mean, std, threshold }: any) {
  if (!active || !payload?.length) return null

  let ratio: number | null = null
  for (const p of payload) {
    if (p.value != null && typeof p.value === 'number') { ratio = p.value; break }
  }
  if (ratio == null) return null

  const z      = std > 0 ? (ratio - mean) / std : 0
  const zColor = z > threshold ? '#c0504a' : z < -threshold ? '#4a9c6a' : '#a0a0a0'

  return (
    <div style={{
      background: '#1f1f1f', border: '1px solid #2a2a2a',
      borderRadius: 2, padding: '8px 12px',
    }}>
      <p style={{ color: '#8a8a8a', fontSize: 10, fontFamily: 'system-ui', margin: '0 0 6px' }}>
        {label}
      </p>
      <p style={{ color: '#f5f5f5', fontSize: 12, fontFamily: '"JetBrains Mono", monospace', margin: '0 0 3px', fontWeight: 600 }}>
        {ratio.toFixed(4)}
      </p>
      <p style={{ color: zColor, fontSize: 11, fontFamily: '"JetBrains Mono", monospace', margin: 0 }}>
        Z: {z >= 0 ? '+' : ''}{z.toFixed(2)}σ
      </p>
    </div>
  )
}

export default function RatioChart({
  pricesA, pricesB, dates, tickerA, tickerB,
  signal, threshold = 2, lookback = 60,
  entryRatio, entryLabel,
}: Props) {
  const [displayDays, setDisplayDays] = useState(lookback)

  const n = pricesA.length
  if (n < 10) return null

  // ── Todos os pontos válidos ────────────────────────────────────────────────
  const allValid: Array<{ date: string; ratio: number }> = []
  for (let i = 0; i < n; i++) {
    const a = pricesA[i], b = pricesB[i]
    if (!a || !b || b === 0 || !isFinite(a) || !isFinite(b)) continue
    const r = a / b
    if (isFinite(r) && r > 0) allValid.push({ date: dates[i] ?? String(i), ratio: r })
  }
  if (allValid.length < 10) return null

  // ── Stats: calculados sobre os últimos `lookback` pontos (janela fixa) ─────
  const statsSlice   = allValid.slice(-lookback)
  const statsRatios  = statsSlice.map(d => d.ratio)
  const mean         = statsRatios.reduce((a, b) => a + b, 0) / statsRatios.length
  const variance     = statsRatios.reduce((a, b) => a + (b - mean) ** 2, 0) / statsRatios.length
  const std          = Math.sqrt(variance)

  // Bandas horizontais fixas
  const b3p = mean + 3 * std
  const b2p = mean + threshold * std
  const b1p = mean + std
  const b1n = mean - std
  const b2n = mean - threshold * std
  const b3n = mean - 3 * std

  // ── Dados para exibição: últimos `displayDays` pontos ─────────────────────
  const displaySlice = allValid.slice(-Math.min(displayDays, allValid.length))

  interface DataPoint {
    date:    string
    ratio:   number
    inShort: number | null
    inLong:  number | null
  }

  const data: DataPoint[] = displaySlice.map(({ date, ratio }) => ({
    date,
    ratio,
    inShort: ratio > b2p ? ratio : null,
    inLong:  ratio < b2n ? ratio : null,
  }))

  // ── Estado atual ──────────────────────────────────────────────────────────
  const currentRatio = allValid[allValid.length - 1].ratio
  const currentZ     = std > 0 ? (currentRatio - mean) / std : 0

  // Direction derived exclusively from the current ratio z-score.
  // The DB signal (scan-time OLS z-score) is NOT used here — it may be stale
  // or computed in the BA direction, which would invert the label.
  const direction =
    currentZ > threshold  ? 'short' :
    currentZ < -threshold ? 'long'  : null

  const dotColor   = direction === 'short' ? '#c0504a' : direction === 'long' ? '#4a9c6a' : '#d4b87a'
  const stateLabel = direction === 'short' ? 'SHORT SPREAD' : direction === 'long' ? 'LONG SPREAD' : 'NEUTRO'

  // ── R/R ──────────────────────────────────────────────────────────────────
  // Stop rule: 1/3 of the potential (distance from entry to mean).
  // This guarantees R/R ≥ 3:1 and avoids the arbitrary ±3σ anchor.
  const target    = mean
  const potential = Math.abs(currentRatio - target)
  const stopLevel = direction === 'long'
    ? currentRatio - potential / 3
    : direction === 'short'
    ? currentRatio + potential / 3
    : null
  const gainPct = direction != null
    ? potential / currentRatio * 100 : null
  const riskPct = direction != null
    ? (potential / 3) / currentRatio * 100 : null
  const rr      = gainPct != null && riskPct != null && riskPct > 0
    ? gainPct / riskPct : null

  // ── Domínio Y ─────────────────────────────────────────────────────────────
  const displayRatios = displaySlice.map(d => d.ratio)
  const allY = [...displayRatios, b3p, b3n]
  const yMin = Math.min(...allY) * 0.985
  const yMax = Math.max(...allY) * 1.015

  return (
    <div style={{ background: '#1f1f1f', border: '1px solid #2e2e2e', borderRadius: 2 }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px 8px', gap: 12,
      }}>
        {/* Título + estado atual */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <p style={{ color: '#8a8a8a', fontSize: 10, letterSpacing: '0.1em', fontFamily: 'system-ui', margin: 0 }}>
            RATIO {tickerA} / {tickerB}
          </p>
          <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, color: dotColor, fontWeight: 700 }}>
            {currentRatio.toFixed(4)}
          </span>
          <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: dotColor }}>
            Z {currentZ >= 0 ? '+' : ''}{currentZ.toFixed(2)}σ
          </span>
          <span style={{
            fontSize: 9, letterSpacing: '0.1em', fontFamily: 'system-ui', color: dotColor,
            padding: '2px 8px', border: `1px solid ${dotColor}44`, borderRadius: 2,
          }}>
            {stateLabel}
          </span>
        </div>

        {/* Seletor de histórico */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 9, color: '#8a8a8a', fontFamily: 'system-ui', letterSpacing: '0.08em' }}>
            HISTÓRICO
          </span>
          <select
            value={displayDays}
            onChange={e => setDisplayDays(Number(e.target.value))}
            style={{
              background: '#2a2a2a',
              border: '1px solid #2a2a2a',
              color: '#d4b87a',
              fontSize: 11,
              fontFamily: '"JetBrains Mono", monospace',
              padding: '3px 8px',
              borderRadius: 2,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {DISPLAY_OPTIONS.map(d => (
              <option key={d} value={d}>{d}d</option>
            ))}
          </select>
          {displayDays !== lookback && (
            <span style={{ fontSize: 9, color: '#8a8a8a', fontFamily: 'system-ui' }}>
              (bandas: {lookback}d)
            </span>
          )}
        </div>
      </div>

      {/* ── Gráfico ──────────────────────────────────────────────────────── */}
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 8, right: 100, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#191919" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: '#3a3a3a', fontFamily: 'JetBrains Mono' }}
            tickLine={false}
            axisLine={{ stroke: '#2a2a2a' }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 9, fill: '#3a3a3a', fontFamily: 'JetBrains Mono' }}
            tickLine={false}
            axisLine={false}
            width={52}
            tickFormatter={(v: number) => v.toFixed(3)}
            domain={[yMin, yMax]}
          />
          <Tooltip content={<RatioTooltip mean={mean} std={std} threshold={threshold} />} />

          {/* Zonas de entrada */}
          <ReferenceArea y1={b2p} y2={yMax} fill="rgba(192,80,74,0.07)" stroke="none" />
          <ReferenceArea y1={yMin} y2={b2n} fill="rgba(74,156,106,0.07)" stroke="none" />

          {/* +3σ */}
          <ReferenceLine y={b3p} stroke="#4a1a1a" strokeWidth={0.8} strokeDasharray="2 6"
            label={{ value: `+3σ  ${b3p.toFixed(4)}`, position: 'right', fill: '#4a2020', fontSize: 9, fontFamily: 'JetBrains Mono' }} />
          {/* +2σ */}
          <ReferenceLine y={b2p} stroke="#c0504a" strokeWidth={1} strokeDasharray="6 3"
            label={{ value: `+${threshold}σ  ${b2p.toFixed(4)}`, position: 'right', fill: '#c0504a', fontSize: 9, fontFamily: 'JetBrains Mono' }} />
          {/* +1σ */}
          <ReferenceLine y={b1p} stroke="#444455" strokeWidth={0.7} strokeDasharray="3 5"
            label={{ value: `+1σ  ${b1p.toFixed(4)}`, position: 'right', fill: '#555565', fontSize: 9, fontFamily: 'JetBrains Mono' }} />
          {/* Média — linha branca tracejada */}
          <ReferenceLine y={mean} stroke="#d8d8d8" strokeWidth={1.2} strokeDasharray="8 4"
            label={{ value: `MÉD  ${mean.toFixed(4)}`, position: 'right', fill: '#d8d8d8', fontSize: 9, fontFamily: 'JetBrains Mono', fontWeight: 600 }} />
          {/* -1σ */}
          <ReferenceLine y={b1n} stroke="#444455" strokeWidth={0.7} strokeDasharray="3 5"
            label={{ value: `-1σ  ${b1n.toFixed(4)}`, position: 'right', fill: '#555565', fontSize: 9, fontFamily: 'JetBrains Mono' }} />
          {/* -2σ */}
          <ReferenceLine y={b2n} stroke="#4a9c6a" strokeWidth={1} strokeDasharray="6 3"
            label={{ value: `-${threshold}σ  ${b2n.toFixed(4)}`, position: 'right', fill: '#4a9c6a', fontSize: 9, fontFamily: 'JetBrains Mono' }} />
          {/* -3σ */}
          <ReferenceLine y={b3n} stroke="#1a3a20" strokeWidth={0.8} strokeDasharray="2 6"
            label={{ value: `-3σ  ${b3n.toFixed(4)}`, position: 'right', fill: '#2a5030', fontSize: 9, fontFamily: 'JetBrains Mono' }} />

          {/* Linha de entrada da operação (opcional) */}
          {entryRatio != null && (
            <ReferenceLine
              y={entryRatio}
              stroke="#d4b87a"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              label={{
                value: entryLabel ?? `ENTRADA  ${entryRatio.toFixed(4)}`,
                position: 'right',
                fill: '#d4b87a',
                fontSize: 9,
                fontFamily: 'JetBrains Mono',
                fontWeight: 600,
              }}
            />
          )}

          {/* Linha base do ratio — branca-acinzentada, contínua */}
          <Line
            type="linear"
            dataKey="ratio"
            stroke="#c0c0c8"
            strokeWidth={1.5}
            isAnimationActive={false}
            legendType="none"
            dot={(dotProps: any) => {
              const { cx, cy, index } = dotProps
              if (index !== data.length - 1) return <g key={`d${index}`} />
              return (
                <g key="dot-current">
                  <circle cx={cx} cy={cy} r={7} fill={dotColor} opacity={0.18} />
                  <circle cx={cx} cy={cy} r={4} fill={dotColor} />
                </g>
              )
            }}
          />
          {/* Overlay vermelho — trecho acima de +2σ */}
          <Line type="linear" dataKey="inShort" stroke="#c0504a" strokeWidth={2.5}
            dot={false} isAnimationActive={false} connectNulls={false} legendType="none" />
          {/* Overlay verde — trecho abaixo de -2σ */}
          <Line type="linear" dataKey="inLong" stroke="#4a9c6a" strokeWidth={2.5}
            dot={false} isAnimationActive={false} connectNulls={false} legendType="none" />
        </ComposedChart>
      </ResponsiveContainer>

      {/* ── Bloco de Risco / Retorno ─────────────────────────────────────── */}
      {direction != null && stopLevel != null && gainPct != null && riskPct != null && (
        <div style={{ borderTop: '1px solid #191919', padding: '12px 16px' }}>

          {/* Linha de operação: compra / vende / direção do ratio */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 20,
            marginBottom: 12,
            padding: '8px 12px',
            background: '#1f1f1f',
            border: '1px solid #2e2e2e',
            borderRadius: 2,
            flexWrap: 'wrap',
          }}>
            <div>
              <p style={{ fontSize: 9, letterSpacing: '0.1em', fontFamily: 'system-ui', color: '#8a8a8a', margin: '0 0 2px' }}>COMPRA</p>
              <p style={{ fontSize: 14, fontFamily: '"JetBrains Mono", monospace', color: '#4a9c6a', margin: 0, fontWeight: 700 }}>
                {direction === 'long' ? tickerA : tickerB}
              </p>
            </div>
            <div style={{ color: '#2a2a2a', fontSize: 18 }}>×</div>
            <div>
              <p style={{ fontSize: 9, letterSpacing: '0.1em', fontFamily: 'system-ui', color: '#8a8a8a', margin: '0 0 2px' }}>VENDE</p>
              <p style={{ fontSize: 14, fontFamily: '"JetBrains Mono", monospace', color: '#c0504a', margin: 0, fontWeight: 700 }}>
                {direction === 'long' ? tickerB : tickerA}
              </p>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <p style={{ fontSize: 9, letterSpacing: '0.1em', fontFamily: 'system-ui', color: '#8a8a8a', margin: '0 0 2px' }}>RATIO {tickerA}/{tickerB} PRECISA</p>
              <p style={{ fontSize: 13, fontFamily: '"JetBrains Mono", monospace', color: dotColor, margin: 0, fontWeight: 700 }}>
                {direction === 'long' ? '↑ SUBIR' : '↓ CAIR'}
              </p>
            </div>
          </div>

          {/* Métricas em grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: '8px 20px',
            marginBottom: 10,
          }}>
            {[
              { label: `RATIO ENTRADA (${tickerA}/${tickerB})`, value: currentRatio.toFixed(4), color: dotColor },
              { label: `ALVO — RATIO MÉDIO`,                    value: target.toFixed(4),        color: '#d8d8d8' },
              { label: 'STOP (1/3 pot.)',                        value: stopLevel.toFixed(4),     color: direction === 'long' ? '#c0504a' : '#4a9c6a' },
              { label: 'POTENCIAL',    value: `+${gainPct.toFixed(2)}%`,     color: '#4a9c6a' },
              { label: 'RISCO',        value: `-${riskPct.toFixed(2)}%`,     color: '#c0504a' },
              {
                label: 'RISCO : RETORNO',
                value: rr != null ? `1 : ${rr.toFixed(1)}` : '—',
                color: rr != null && rr >= 2 ? '#4a9c6a' : rr != null && rr >= 1 ? '#d4b87a' : '#c0504a',
              },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p style={{ fontSize: 9, letterSpacing: '0.1em', fontFamily: 'system-ui', color: '#8a8a8a', margin: '0 0 2px', textTransform: 'uppercase' }}>
                  {label}
                </p>
                <p style={{ fontSize: 13, fontFamily: '"JetBrains Mono", monospace', color, margin: 0, fontWeight: 600 }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Texto explicativo */}
          <p style={{ fontSize: 11, fontFamily: 'system-ui', color: '#8a8a8a', margin: 0, lineHeight: 1.6 }}>
            {direction === 'long'
              ? `Compra ${tickerA} e vende ${tickerB}. O ratio ${tickerA}/${tickerB} está abaixo da média — espera-se que suba de ${currentRatio.toFixed(4)} até ${target.toFixed(4)}. Stop em ${stopLevel.toFixed(4)} se o ratio continuar caindo (-${riskPct.toFixed(2)}%). R/R: 1 : ${rr?.toFixed(1) ?? '—'}.`
              : `Vende ${tickerA} e compra ${tickerB}. O ratio ${tickerA}/${tickerB} está acima da média — espera-se que caia de ${currentRatio.toFixed(4)} até ${target.toFixed(4)}. Stop em ${stopLevel.toFixed(4)} se o ratio continuar subindo (-${riskPct.toFixed(2)}%). R/R: 1 : ${rr?.toFixed(1) ?? '—'}.`
            }
          </p>
        </div>
      )}
    </div>
  )
}
