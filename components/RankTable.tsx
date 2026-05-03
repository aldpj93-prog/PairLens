'use client'

import { Fragment, useState } from 'react'
import type { CointegratedPair } from '@/lib/supabase'
import PairDetailPanel from './PairDetailPanel'
import { fmt4, fmtP, fmtHL, fmtScore, fmtPrice, signalLabel } from '@/lib/utils'

interface Props {
  pairs: CointegratedPair[]
  zThreshold?: number
  mode?: 'entrada' | 'observacao'
  plan?: 'FREE' | 'starter' | 'pro'
  onExecutar?: (pair: CointegratedPair) => void
}

const LOCKED_TOP_N = 20

export default function RankTable({ pairs, zThreshold = 2.0, mode = 'entrada', plan = 'FREE', onExecutar }: Props) {
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

  function hashSeed(s: string): number {
    let h = 2166136261
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
    return h >>> 0
  }

  function distortPair(pair: CointegratedPair): CointegratedPair {
    const seed = hashSeed(pair.id)
    const r = (n: number) => (Math.sin(seed + n) + 1) / 2
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const fakeTicker = (n: number) =>
      letters[Math.floor(r(n) * 26)] +
      letters[Math.floor(r(n + 1) * 26)] +
      letters[Math.floor(r(n + 2) * 26)] +
      letters[Math.floor(r(n + 3) * 26)] +
      String(Math.floor(r(n + 4) * 9) + 1)
    return {
      ...pair,
      id: `locked-${seed.toString(36)}`,
      ticker_a: fakeTicker(1),
      ticker_b: fakeTicker(11),
      score: 60 + r(2) * 39,
      adf_statistic: -(2 + r(3) * 4),
      p_value: r(4) * 0.05,
      z_score: (r(5) - 0.5) * 6,
      half_life: 2 + r(6) * 30,
      signal: r(7) > 0.5 ? 'long_spread' : 'short_spread',
      price_a: 5 + r(8) * 95,
      price_b: 5 + r(9) * 95,
      pri: 0.5 + r(10) * 4,
    }
  }

  function signalStyle(signal: string | null): React.CSSProperties {
    if (signal === 'long_spread')  return { color: '#4a7c59', fontWeight: 600 }
    if (signal === 'short_spread') return { color: '#8c3f3f', fontWeight: 600 }
    return { color: '#8a8a8a' }
  }

  return (
    <div>
      {plan === 'FREE' && sorted.length > 0 && (
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
              {['#', 'PAR', 'SCORE', 'ADF STAT', 'p-VALOR', 'Z-SCORE', 'MEIA-VIDA', 'SINAL', 'PREÇO A', 'PREÇO B', 'PRI', '', ''].map((h, i) => (
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
              const locked = plan === 'FREE' && idx < LOCKED_TOP_N
              const view = locked ? distortPair(pair) : pair
              return (
              <Fragment key={view.id}>
                <tr
                  style={{
                    background: selectedId === view.id ? '#151515' : 'transparent',
                    cursor: locked ? 'not-allowed' : 'pointer',
                    filter: locked ? 'blur(5px)' : undefined,
                    pointerEvents: locked ? 'none' : undefined,
                    userSelect: locked ? 'none' : undefined,
                  }}
                  onClick={() => !locked && setSelectedId(prev => prev === view.id ? null : view.id)}
                >
                  <td style={{ color: '#8a8a8a' }}>{idx + 1}</td>
                  <td>
                    <span style={{ color: '#f5f5f5', letterSpacing: '0.05em' }}>
                      {view.ticker_a}
                    </span>
                    <span style={{ color: '#8a8a8a', margin: '0 4px' }}>/</span>
                    <span style={{ color: '#a0a0a0' }}>{view.ticker_b}</span>
                  </td>
                  <td style={{ color: '#d4b87a' }}>{fmtScore(view.score)}</td>
                  <td>{fmt4(view.adf_statistic)}</td>
                  <td>{fmtP(view.p_value)}</td>
                  <td style={{
                    color: view.z_score != null
                      ? Math.abs(view.z_score) > zThreshold
                        ? view.z_score > 0 ? '#8c3f3f' : '#4a7c59'
                        : '#f5f5f5'
                      : '#f5f5f5'
                  }}>
                    {fmt4(view.z_score)}
                  </td>
                  <td>{fmtHL(view.half_life)}</td>
                  <td>
                    <span style={signalStyle(view.signal)}>
                      {signalLabel(view.signal)}
                    </span>
                  </td>
                  <td>{fmtPrice(view.price_a)}</td>
                  <td>{fmtPrice(view.price_b)}</td>
                  <td>{fmtPrice(view.pri)}</td>
                  <td>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        if (locked) return
                        setSelectedId(prev => prev === view.id ? null : view.id)
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
                      {selectedId === view.id ? 'FECHAR' : 'VER'}
                    </button>
                  </td>
                  <td>
                    {onExecutar && (
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          if (locked) return
                          onExecutar(view)
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
                {selectedId === view.id && (
                  <tr>
                    <td colSpan={12} style={{ padding: '8px 0 16px', background: '#0a0a0a' }}>
                      <PairDetailPanel
                        pair={view}
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
