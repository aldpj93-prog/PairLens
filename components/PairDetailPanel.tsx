'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import type { CointegratedPair } from '@/lib/supabase'
import { fmt2, fmt4, fmtP, fmtHL, fmtScore, signalLabel, signalClass, fmtHedge } from '@/lib/utils'

const RatioChart          = dynamic(() => import('./RatioChart'),           { ssr: false })
const NormalizedPricesChart = dynamic(() => import('./NormalizedPricesChart'), { ssr: false })

interface Props {
  pair:        CointegratedPair
  onClose:     () => void
  zThreshold?: number
  lookback?:   number
}

interface ChartData {
  residuals: number[]
  zScores:   number[]
  pricesA:   number[]
  pricesB:   number[]
  dates:     string[]
}

export default function PairDetailPanel({
  pair,
  onClose,
  zThreshold = 2.0,
  lookback   = 60,
}: Props) {
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    setLoading(true)
    setChartData(null)

    async function load() {
      try {
        const res = await fetch(`/api/history?tickers=${pair.ticker_a},${pair.ticker_b}`)
        if (!res.ok) { setLoading(false); return }
        const data = await res.json()
        setChartData(data)
      } catch {
        // falha silenciosa — exibe mensagem de erro
      }
      setLoading(false)
    }

    load()
  }, [pair.id])

  // ── Ratio stats calculados a partir dos preços reais ─────────────────────
  const ratioStats = useMemo(() => {
    if (!chartData) return null
    const ratios = chartData.pricesA
      .map((a, i) => {
        const b = chartData.pricesB[i]
        if (!b || b === 0) return null
        const r = a / b
        return isFinite(r) && r > 0 ? r : null
      })
      .filter((r): r is number => r != null)

    if (ratios.length < 10) return null

    const w      = Math.min(lookback, ratios.length)
    const recent = ratios.slice(-w)
    const mean   = recent.reduce((a, b) => a + b, 0) / recent.length
    const std    = Math.sqrt(recent.reduce((a, b) => a + (b - mean) ** 2, 0) / recent.length)
    const current = ratios[ratios.length - 1]
    const z       = std > 0 ? (current - mean) / std : 0
    return { mean, std, current, z }
  }, [chartData, lookback])

  const sigClass = signalClass(pair.signal)
  const sigLabel = signalLabel(pair.signal)

  // Cor do sinal
  const sigColor =
    sigClass.replace('text-', '') === 'positive' ? '#4a7c59'
    : sigClass.replace('text-', '') === 'negative' ? '#8c3f3f'
    : '#8a8a8a'

  return (
    <div style={{
      background: '#1f1f1f',
      border: '1px solid #3d3d3d',
      borderRadius: 2,
      padding: 20,
      marginTop: 2,
    }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 15, color: '#f5f5f5', fontWeight: 600, letterSpacing: '0.05em',
          }}>
            {pair.ticker_a} / {pair.ticker_b}
          </span>
          <span style={{
            fontSize: 11, fontFamily: 'system-ui', letterSpacing: '0.1em',
            color: sigColor, fontWeight: 600,
          }}>
            {sigLabel}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', color: '#8a8a8a',
            fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: '0 4px',
          }}
        >
          ×
        </button>
      </div>

      {/* ── Gráficos ───────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[260, 180].map((h, i) => (
            <div key={i} style={{
              height: h, background: '#1f1f1f',
              border: '1px solid #2e2e2e', borderRadius: 2,
            }} />
          ))}
          <p style={{ color: '#8a8a8a', fontSize: 11, fontFamily: 'system-ui', marginTop: 4 }}>
            Carregando dados de preço...
          </p>
        </div>
      ) : chartData ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Gráfico unificado: ratio + bandas + z-score anotado */}
          <RatioChart
            pricesA={chartData.pricesA}
            pricesB={chartData.pricesB}
            dates={chartData.dates}
            tickerA={pair.ticker_a}
            tickerB={pair.ticker_b}
            signal={pair.signal ?? undefined}
            threshold={zThreshold}
            lookback={lookback}
          />
          {/* Preços normalizados — para visualizar o movimento individual */}
          <NormalizedPricesChart
            pricesA={chartData.pricesA}
            pricesB={chartData.pricesB}
            dates={chartData.dates}
            tickerA={pair.ticker_a}
            tickerB={pair.ticker_b}
          />
        </div>
      ) : (
        <p style={{ color: '#8c3f3f', fontSize: 12, fontFamily: 'system-ui' }}>
          Falha ao carregar dados de preço para este par.
        </p>
      )}

      {/* ── Data block ─────────────────────────────────────────────────── */}
      <div style={{
        marginTop: 16,
        background: '#1f1f1f',
        border: '1px solid #2e2e2e',
        padding: '12px 16px',
        borderRadius: 2,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
        gap: '10px 24px',
      }}>
        {[
          // ── Proporção operacional ──────────────────────────────────────
          ['Proporção A : B', fmtHedge(pair.hedge_ratio)],
          ['Preço A (R$)',    fmt2(pair.price_a)],
          ['Preço B (R$)',    fmt2(pair.price_b)],

          // ── Ratio em valores reais ────────────────────────────────────
          ['Ratio Atual',    ratioStats ? ratioStats.current.toFixed(4) : fmt4(pair.z_score)],
          ['Ratio Médio',    ratioStats ? ratioStats.mean.toFixed(4)    : fmt4(pair.spread_mean)],
          ['Ratio Desvio',   ratioStats ? ratioStats.std.toFixed(4)     : fmt4(pair.spread_std)],
          ['Z-Score Atual',  ratioStats
            ? (ratioStats.z >= 0 ? '+' : '') + ratioStats.z.toFixed(4)
            : fmt4(pair.z_score)],

          // ── Qualidade estatística ─────────────────────────────────────
          ['Estatística ADF', fmt4(pair.adf_statistic)],
          ['p-valor',         fmtP(pair.p_value)],
          ['Meia-vida',       fmtHL(pair.half_life)],
          ['Score',           fmtScore(pair.score)],
          ['Sinal',           sigLabel],
        ].map(([label, value]) => (
          <div key={label}>
            <p style={{
              color: '#8a8a8a', fontSize: 10, fontFamily: 'system-ui',
              letterSpacing: '0.08em', margin: '0 0 2px',
            }}>
              {label}
            </p>
            <p style={{
              color: label === 'Proporção A : B' ? '#d4b87a' : '#f5f5f5',
              fontSize: 13,
              fontFamily: '"JetBrains Mono", monospace',
              margin: 0,
              fontWeight: label === 'Proporção A : B' ? 600 : 400,
            }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Nota explicativa sobre a proporção ─────────────────────────── */}
      {pair.hedge_ratio != null && isFinite(pair.hedge_ratio) && (
        <div style={{
          marginTop: 8,
          padding: '10px 14px',
          background: '#1f1f1f',
          border: '1px solid #2e2e2e',
          borderRadius: 2,
        }}>
          <p style={{
            fontSize: 11, fontFamily: 'system-ui', color: '#8a8a8a',
            margin: 0, lineHeight: 1.6,
          }}>
            <span style={{ color: '#a0a0a0', fontWeight: 600 }}>Proporção {fmtHedge(pair.hedge_ratio)}</span>
            {Number(pair.hedge_ratio) < 1
              ? ` — para cada ${(1 / Number(pair.hedge_ratio)).toFixed(2)} unidades compradas de ${pair.ticker_a}, venda 1 unidade de ${pair.ticker_b}.`
              : Number(pair.hedge_ratio) > 1
              ? ` — para cada 1 unidade comprada de ${pair.ticker_a}, venda ${Number(pair.hedge_ratio).toFixed(2)} unidades de ${pair.ticker_b}.`
              : ` — compre e venda quantidades iguais de ${pair.ticker_a} e ${pair.ticker_b}.`
            }
          </p>
        </div>
      )}
    </div>
  )
}
