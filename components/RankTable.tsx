'use client'

import { Fragment, useState } from 'react'
import type { CointegratedPair } from '@/lib/supabase'
import PairDetailPanel from './PairDetailPanel'
import { fmt4, fmtP, fmtHL, fmtScore, fmtPrice, signalLabel } from '@/lib/utils'

interface Props {
  pairs: CointegratedPair[]
  zThreshold?: number
  mode?: 'entrada' | 'observacao'
  plan?: 'free' | 'starter' | 'pro'
  onExecutar?: (pair: CointegratedPair) => void
}

const LOCKED_TOP_N = 20

export default function RankTable({ pairs, zThreshold = 2.0, mode = 'entrada', plan = 'free', onExecutar }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const sorted = mode === 'entrada'
    ? [...pairs]
        .filter(p =>
          (p.signal === 'long_spread' || p.signal === 'short_spread') &&
          (p.score ?? 0) >= 80
        )
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    : [...pairs]
        .filter(p =>
          (p.signal == null || p.signal === 'neutral') &&
          p.z_score != null &&
          Math.abs(p.z_score) <= zThreshold
        )
        .sort((a, b) => Math.abs(b.z_score ?? 0) - Math.abs(a.z_score ?? 0))

  function signalStyle(signal: string | null): React.CSSProperties {
    if (signal === 'long_spread')  return { color: '#4a7c59', fontWeight: 600 }
    if (signal === 'short_spread') return { color: '#8c3f3f', fontWeight: 600 }
    return { color: '#8a8a8a' }
  }

  return (
    <div>
      {plan === 'free' && sorted.length > 0 && (
        <div style={{
          padding: '10px 16px',
          background: '#1a1410',
          borderBottom: '1px solid #3d3d3d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}>
          <span style={{ color: '#d4b87a', fontSize: 11, letterSpacing: '0.08em', fontFamily: 'system-ui' }}>
            TOP {LOCKED_TOP_N} PARES BLOQUEADOS — FAÇA UPGRADE PARA VISUALIZAR
          </span>
          <a
            href="/planos"
            style={{
              background: 'transparent',
              border: '1px solid #d4b87a',
              color: '#d4b87a',
              fontSize: 10,
              padding: '4px 12px',
              letterSpacing: '0.1em',
              fontFamily: 'system-ui',
              borderRadius: 2,
              textDecoration: 'none',
            }}
          >
            VER PLANOS
          </a>
        </div>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              {['#', 'PAIR', 'SCORE', 'ADF STAT', 'p-VALUE', 'Z-SCORE', 'HALF-LIFE', 'SIGNAL', 'PRICE A', 'PRICE B', 'PRI', '', ''].map((h, i) => (
                <th key={`${h}-${i}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={13} style={{ color: '#8a8a8a', textAlign: 'center', padding: '32px 0' }}>
                  {mode === 'entrada'
                    ? 'Nenhum par com sinal ativo e score ≥ 80.'
                    : 'Nenhum par em observação no momento.'}
                </td>
              </tr>
            )}
            {sorted.map((pair, idx) => {
              const locked = plan.toLowerCase() === 'free' && idx < LOCKED_TOP_N
              return (
              <Fragment key={pair.id}>
                <tr
                  style={{
                    background: selectedId === pair.id ? '#151515' : 'transparent',
                    cursor: locked ? 'not-allowed' : 'pointer',
                    filter: locked ? 'blur(5px)' : undefined,
                    pointerEvents: locked ? 'none' : undefined,
                    userSelect: locked ? 'none' : undefined,
                  }}
                  onClick={() => !locked && setSelectedId(prev => prev === pair.id ? null : pair.id)}
                >
                  <td style={{ color: '#8a8a8a' }}>{idx + 1}</td>
                  <td>
                    <span style={{ color: '#f5f5f5', letterSpacing: '0.05em' }}>
                      {pair.ticker_a}
                    </span>
                    <span style={{ color: '#8a8a8a', margin: '0 4px' }}>/</span>
                    <span style={{ color: '#a0a0a0' }}>{pair.ticker_b}</span>
                  </td>
                  <td style={{ color: '#d4b87a' }}>{fmtScore(pair.score)}</td>
                  <td>{fmt4(pair.adf_statistic)}</td>
                  <td>{fmtP(pair.p_value)}</td>
                  <td style={{
                    color: pair.z_score != null
                      ? Math.abs(pair.z_score) > zThreshold
                        ? pair.z_score > 0 ? '#8c3f3f' : '#4a7c59'
                        : '#f5f5f5'
                      : '#f5f5f5'
                  }}>
                    {fmt4(pair.z_score)}
                  </td>
                  <td>{fmtHL(pair.half_life)}</td>
                  <td>
                    <span style={signalStyle(pair.signal)}>
                      {signalLabel(pair.signal)}
                    </span>
                  </td>
                  <td>{fmtPrice(pair.price_a)}</td>
                  <td>{fmtPrice(pair.price_b)}</td>
                  <td>{fmtPrice(pair.pri)}</td>
                  <td>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        setSelectedId(prev => prev === pair.id ? null : pair.id)
                      }}
                      style={{
                        background: 'none',
                        border: '1px solid #3d3d3d',
                        color: '#a0a0a0',
                        fontSize: 10,
                        padding: '3px 8px',
                        cursor: 'pointer',
                        letterSpacing: '0.08em',
                        fontFamily: 'system-ui',
                        borderRadius: 2,
                      }}
                      className="hover-opacity"
                    >
                      {selectedId === pair.id ? 'CLOSE' : 'VIEW'}
                    </button>
                  </td>
                  <td>
                    {onExecutar && (
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          onExecutar(pair)
                        }}
                        style={{
                          background: 'transparent',
                          border: '1px solid #d4b87a',
                          color: '#d4b87a',
                          fontSize: 10,
                          padding: '3px 8px',
                          cursor: 'pointer',
                          letterSpacing: '0.08em',
                          fontFamily: 'system-ui',
                          borderRadius: 2,
                        }}
                        className="hover-opacity"
                      >
                        EXECUTAR
                      </button>
                    )}
                  </td>
                </tr>
                {selectedId === pair.id && (
                  <tr>
                    <td colSpan={12} style={{ padding: '8px 0 16px', background: '#0a0a0a' }}>
                      <PairDetailPanel
                        pair={pair}
                        onClose={() => setSelectedId(null)}
                        zThreshold={zThreshold}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
