'use client'

import { useEffect, useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import type { ScanRun } from '@/lib/supabase'
import { fmtDateBRT } from '@/lib/utils'

export default function ScanRunStatus() {
  const [runs, setRuns] = useState<ScanRun[]>([])
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()

    async function load() {
      const { data } = await supabase
        .from('scan_runs')
        .select('*')
        .order('triggered_at', { ascending: false })
        .limit(10)
      if (data) setRuns(data as ScanRun[])
    }

    load()

    // Realtime subscription
    const channel = supabase
      .channel('scan_runs_sidebar')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scan_runs' }, load)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const latest = runs[0]

  return (
    <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: 12 }}>
      {/* Latest scan summary */}
      <div style={{ marginBottom: 8 }}>
        <p style={{ color: '#4a4a4a', fontSize: 10, letterSpacing: '0.08em', marginBottom: 4 }}>
          LAST SCAN
        </p>
        {latest ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: latest.status === 'completed' ? '#4a7c59'
                  : latest.status === 'failed' ? '#8c3f3f' : '#c8a96e',
                flexShrink: 0,
              }}
            />
            <span style={{ color: '#7a7a7a', fontSize: 11, fontFamily: 'system-ui' }}>
              {fmtDateBRT(latest.triggered_at)}
            </span>
          </div>
        ) : (
          <span style={{ color: '#4a4a4a', fontSize: 11 }}>No scans yet</span>
        )}
      </div>

      {/* Collapsible history */}
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{
          background: 'none',
          border: 'none',
          color: '#4a4a4a',
          fontSize: 10,
          letterSpacing: '0.08em',
          cursor: 'pointer',
          padding: 0,
          marginBottom: collapsed ? 0 : 6,
        }}
      >
        {collapsed ? '+ SCAN HISTORY' : '- SCAN HISTORY'}
      </button>

      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {runs.map(run => (
            <div
              key={run.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 0',
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: run.status === 'completed' ? '#4a7c59'
                    : run.status === 'failed' ? '#8c3f3f' : '#c8a96e',
                  flexShrink: 0,
                }}
              />
              <span style={{
                color: '#4a4a4a',
                fontSize: 10,
                fontFamily: 'system-ui',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {fmtDateBRT(run.triggered_at)}
              </span>
              {run.pairs_found != null && (
                <span style={{ color: '#333333', fontSize: 10, marginLeft: 'auto', flexShrink: 0 }}>
                  {run.pairs_found}p
                </span>
              )}
            </div>
          ))}
          {runs.length === 0 && (
            <span style={{ color: '#4a4a4a', fontSize: 11 }}>No history</span>
          )}
        </div>
      )}
    </div>
  )
}
