'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import type { CointegratedPair, ScanRun } from '@/lib/supabase'
import MetricCard from '@/components/MetricCard'
import RankTable from '@/components/RankTable'
import ExecutarModal from '@/components/ExecutarModal'
import { fmtDateBRT } from '@/lib/utils'

interface ScanStatus {
  running: boolean
  phase: 'idle' | 'universe' | 'fetching' | 'testing' | 'saving'
  tickersFetched: number
  tickersTotal: number
  elapsedMs: number
}

export default function ScannerPage() {
  const [pairs, setPairs]             = useState<CointegratedPair[]>([])
  const [latestRun, setLatestRun]     = useState<ScanRun | null>(null)
  const [scanning, setScanning]       = useState(false)
  const [scanStatus, setScanStatus]   = useState<ScanStatus | null>(null)
  const [zThreshold, setZThreshold]   = useState(2.0)
  const [zInput, setZInput]           = useState('2.0')
  const [loading, setLoading]         = useState(true)
  const [executarPair, setExecutarPair] = useState<CointegratedPair | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ─── Load latest scan run and its pairs ───────────────────────────────────

  const loadLatestData = useCallback(async () => {
    const res = await fetch('/api/express/scanner/latest-data')
    if (!res.ok) {
      setLoading(false)
      return
    }
    const { run, pairs: pairData, zThreshold: zVal } = await res.json()

    setLatestRun(run ?? null)
    setPairs(pairData ?? [])
    if (zVal != null) {
      setZThreshold(zVal)
      setZInput(String(zVal))
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    loadLatestData()

    // Realtime: refresh when scan_runs changes
    const supabaseRT = createBrowserSupabaseClient()
    const channel = supabaseRT
      .channel('scanner_page')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'scan_runs',
      }, () => loadLatestData())
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'scan_runs',
      }, () => loadLatestData())
      .subscribe()

    return () => { supabaseRT.removeChannel(channel) }
  }, [loadLatestData])

  // ─── Scan progress polling ─────────────────────────────────────────────────



  // ─── Trigger manual scan ──────────────────────────────────────────────────

  async function handleRunScan() {
    if (scanning) return
    setScanning(true)
    //setScanStatus({ running: true, phase: 'universe', tickersFetched: 0, tickersTotal: 85, elapsedMs: 0 })
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
      {/* Scan progress banner */}
      {scanning && scanStatus?.running && (
        <div style={{
          background: '#1f1f1f',
          border: '1px solid #d4b87a',
          borderLeft: '3px solid #d4b87a',
          padding: '8px 16px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderRadius: 2,
        }}>
          <span className="spinner" />
          <span style={{
            color: '#d4b87a',
            fontSize: 12,
            fontFamily: '"JetBrains Mono", monospace',
          }}>
            {scanStatus.phase === 'universe' && 'Montando universo de ativos B3...'}
            {scanStatus.phase === 'fetching' && `Buscando histórico — ${scanStatus.tickersFetched} / ${scanStatus.tickersTotal} tickers`}
            {scanStatus.phase === 'testing'  && 'Testando cointegração + filtro de liquidez...'}
            {scanStatus.phase === 'saving'   && 'Salvando resultados...'}
            {(!scanStatus.phase || scanStatus.phase === 'idle') && 'Scan em andamento...'}
            {' '}— {Math.round((scanStatus.elapsedMs || 0) / 1000)}s
          </span>
        </div>
      )}

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 13, letterSpacing: '0.1em', color: '#f5f5f5', fontFamily: 'system-ui', margin: '0 0 4px', fontWeight: 500 }}>
            SCANNER
          </h1>
          {latestRun && (
            <p style={{ color: '#8a8a8a', fontSize: 11, fontFamily: 'system-ui', margin: 0 }}>
              Last scan: {fmtDateBRT(latestRun.triggered_at)}
              {latestRun.pairs_found != null && ` — ${latestRun.pairs_found} pairs found`}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Z threshold input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ color: '#8a8a8a', fontSize: 11, fontFamily: 'system-ui', letterSpacing: '0.08em' }}>
              Z THRESHOLD
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
            {scanning ? 'SCANNING...' : 'RUN SCAN NOW'}
          </button>
        </div>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        <MetricCard
          label="TICKERS SCANNED"
          value={latestRun?.tickers_scanned ?? '—'}
        />
        <MetricCard
          label="PAIRS TESTED"
          value={latestRun?.pairs_tested ?? '—'}
        />
        <MetricCard
          label="COINTEGRATED (p < 0.05)"
          value={latestRun?.pairs_found ?? '—'}
          accent
        />
        <MetricCard
          label="ACTIVE SIGNALS"
          value={withSignal}
          accent={withSignal > 0}
        />
      </div>

      {/* Rank table */}
      <div style={{
        background: '#1f1f1f',
        border: '1px solid #3d3d3d',
        borderRadius: 2,
      }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #2e2e2e' }}>
          <p style={{ color: '#8a8a8a', fontSize: 11, letterSpacing: '0.1em', fontFamily: 'system-ui', margin: 0 }}>
            COINTEGRATED PAIRS — RANKED BY SCORE
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
