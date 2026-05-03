'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import type { CointegratedPair, ScanRun } from '@/lib/supabase'
import MetricCard from '@/components/MetricCard'
import RankTable from '@/components/RankTable'
import ExecutarModal from '@/components/ExecutarModal'
import { fmtDateBRT } from '@/lib/utils'


export default function ScannerPage() {
  const [pairs, setPairs]             = useState<CointegratedPair[]>([])
  const [plan, setPlan]               = useState<'FREE' | 'starter' | 'pro'>('FREE')
  const [latestRun, setLatestRun]     = useState<ScanRun | null>(null)
  const [scanning, setScanning]       = useState(false)
  const [zThreshold, setZThreshold]   = useState(2.0)
  const [zInput, setZInput]           = useState('2.0')
  const [loading, setLoading]         = useState(true)
  const [executarPair, setExecutarPair] = useState<CointegratedPair | null>(null)
  const [tab, setTab] = useState<'entrada' | 'observacao'>('entrada')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ─── Load latest scan run and its pairs ───────────────────────────────────

  const loadLatestData = useCallback(async () => {
    const res = await fetch('/api/express/scanner/latest-data')
    if (!res.ok) {
      setLoading(false)
      return
    }
    //console.log(await res.json())
    const { run, pairs: pairData, zThreshold: zVal, userPlan: planVal } = await res.json()
    // console.log(pairData?.find((p: CointegratedPair) => p.ticker_a?.startsWith('EGIE') && p.ticker_b?.startsWith('CAML')))

    setLatestRun(run ?? null)
    setPairs(pairData ?? [])
    if (planVal) setPlan(planVal)
    if (zVal != null) {
      setZThreshold(zVal)
      setZInput(String(zVal))
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    loadLatestData()

  }, [loadLatestData])




  // ─── Trigger manual scan ──────────────────────────────────────────────────

  async function handleRunScan() {
    if (scanning) return
    setScanning(true)
    await fetch('/api/express/scanner/run', { method: 'POST', credentials: "include" })
  }

  // ─── Update z threshold ───────────────────────────────────────────────────

  async function handleZThresholdUpdate() {
    const v = parseFloat(zInput)
    if (!isFinite(v) || v <= 0) return
    setZThreshold(v)
    await fetch('/api/express/config', {
      method: 'POST',
      credentials: "include",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zscore_threshold: String(v) }),
    })
  }

  // ─── Derived metrics ──────────────────────────────────────────────────────

  const withSignal = pairs.filter(p => p.signal && p.signal !== 'neutral').length

  return (
    <div>


      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 13, letterSpacing: '0.1em', color: '#f5f5f5', fontFamily: 'system-ui', margin: '0 0 4px', fontWeight: 500 }}>
            SCANNER
          </h1>
          {latestRun && (
            <p style={{ color: '#8a8a8a', fontSize: 11, fontFamily: 'system-ui', margin: 0 }}>
              Último scan: {fmtDateBRT(latestRun.triggered_at)}
              {latestRun.pairs_found != null && ` — ${latestRun.pairs_found} pares encontrados`}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Z threshold input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ color: '#8a8a8a', fontSize: 11, fontFamily: 'system-ui', letterSpacing: '0.08em' }}>
              LIMIAR Z
            </label>
            <input
              type="number"
              step="0.1"
              min="0.5"
              max="5"
              value={zInput}
              onChange={e => setZInput(e.target.value)}
              onBlur={handleZThresholdUpdate}
              onKeyDown={e => e.key === 'Enter' && handleZThresholdUpdate()}
              style={{
                width: 64,
                background: '#2a2a2a',
                border: '1px solid #3d3d3d',
                color: '#f5f5f5',
                padding: '5px 8px',
                fontSize: 12,
                fontFamily: '"JetBrains Mono", monospace',
                borderRadius: 2,
              }}
            />
          </div>

          {/* Run scan button */}
          <button
            onClick={handleRunScan}
            disabled={scanning}
            style={{
              background: scanning ? '#2a2a2a' : '#1f1f1f',
              border: `1px solid ${scanning ? '#3d3d3d' : '#4a4a4a'}`,
              color: scanning ? '#8a8a8a' : '#d4b87a',
              fontSize: 11,
              letterSpacing: '0.1em',
              fontFamily: 'system-ui',
              padding: '7px 16px',
              cursor: scanning ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderRadius: 2,
            }}
          >
            {scanning && <span className="spinner" />}
            {scanning ? 'EXECUTANDO...' : 'EXECUTAR SCAN AGORA'}
          </button>
        </div>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        <MetricCard
          label="ATIVOS ESCANEADOS"
          value={latestRun?.tickers_scanned ?? '—'}
        />
        <MetricCard
          label="PARES TESTADOS"
          value={latestRun?.pairs_tested ?? '—'}
        />
        <MetricCard
          label="COINTEGRADOS (p < 0.05)"
          value={latestRun?.pairs_found ?? '—'}
          accent
        />
        <MetricCard
          label="SINAIS ATIVOS"
          value={withSignal}
          accent={withSignal > 0}
        />
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 0, borderBottom: '1px solid #3d3d3d' }}>
        {([
          { key: 'entrada', label: 'PONTO DE ENTRADA' },
          { key: 'observacao', label: 'OBSERVAÇÃO' },
        ] as const).map(t => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                background: active ? '#1f1f1f' : 'transparent',
                border: '1px solid #3d3d3d',
                borderBottom: active ? '1px solid #1f1f1f' : '1px solid #3d3d3d',
                borderTopLeftRadius: 2,
                borderTopRightRadius: 2,
                color: active ? '#d4b87a' : '#8a8a8a',
                fontSize: 11,
                letterSpacing: '0.1em',
                fontFamily: 'system-ui',
                padding: '8px 16px',
                cursor: 'pointer',
                marginBottom: -1,
                marginRight: 4,
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Rank table */}
      <div style={{
        background: '#1f1f1f',
        border: '1px solid #3d3d3d',
        borderTop: 'none',
        borderRadius: 2,
      }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #2e2e2e' }}>
          <p style={{ color: '#8a8a8a', fontSize: 11, letterSpacing: '0.1em', fontFamily: 'system-ui', margin: 0 }}>
            {tab === 'entrada'
              ? 'PARES COM SINAL ATIVO — |Z| > LIMIAR'
              : 'PARES COINTEGRADOS EM OBSERVAÇÃO — |Z| ≤ LIMIAR'}
          </p>
        </div>
        {loading ? (
          <div style={{ padding: 32 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} style={{ height: 36, background: '#2a2a2a', marginBottom: 4, borderRadius: 2 }} />
            ))}
          </div>
        ) : (
          <RankTable
            pairs={pairs}
            zThreshold={zThreshold}
            mode={tab}
            plan={plan}
            onExecutar={pair => setExecutarPair(pair)}
          />
        )}
      </div>

      {executarPair && (
        <ExecutarModal
          pair={executarPair}
          onClose={() => setExecutarPair(null)}
          onSuccess={() => setExecutarPair(null)}
        />
      )}
    </div>
  )
}
