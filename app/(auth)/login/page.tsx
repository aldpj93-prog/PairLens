'use client'

import { useState, FormEvent } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    //console.log(email, password)
    const response = await fetch('/api/express/auth', {
      headers:{
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({email, password})
    });

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div
      style={{ background: '#080808', minHeight: '100vh' }}
      className="flex items-center justify-center"
    >
      <div style={{ width: 360 }}>
        {/* Header */}
        <div className="mb-8">
          <p
            style={{
              color: '#7a7a7a',
              fontSize: 11,
              letterSpacing: '0.15em',
              marginBottom: 6,
              fontFamily: 'system-ui',
            }}
          >
            QUANTITATIVE RESEARCH TERMINAL
          </p>
          <h1
            style={{
              color: '#c8a96e',
              fontSize: 20,
              letterSpacing: '0.2em',
              fontFamily: '"JetBrains Mono", monospace',
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            PAIR<span style={{ color: '#e2e2e2' }}>LENS</span>
          </h1>
          <p
            style={{
              color: '#4a4a4a',
              fontSize: 11,
              fontFamily: 'system-ui',
              letterSpacing: '0.1em',
            }}
          >
            RESTRICTED ACCESS
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="email"
              style={{
                display: 'block',
                color: '#7a7a7a',
                fontSize: 11,
                letterSpacing: '0.1em',
                marginBottom: 6,
                fontFamily: 'system-ui',
              }}
            >
              EMAIL
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={{
                width: '100%',
                background: '#181818',
                border: '1px solid #252525',
                color: '#e2e2e2',
                padding: '10px 12px',
                fontSize: 13,
                fontFamily: '"JetBrains Mono", monospace',
                outline: 'none',
                borderRadius: 2,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              style={{
                display: 'block',
                color: '#7a7a7a',
                fontSize: 11,
                letterSpacing: '0.1em',
                marginBottom: 6,
                fontFamily: 'system-ui',
              }}
            >
              PASSWORD
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{
                width: '100%',
                background: '#181818',
                border: '1px solid #252525',
                color: '#e2e2e2',
                padding: '10px 12px',
                fontSize: 13,
                fontFamily: '"JetBrains Mono", monospace',
                outline: 'none',
                borderRadius: 2,
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <p
              style={{
                color: '#8c3f3f',
                fontSize: 12,
                marginBottom: 12,
                fontFamily: 'system-ui',
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? '#181818' : '#c8a96e',
              color: loading ? '#7a7a7a' : '#080808',
              border: 'none',
              padding: '10px 0',
              fontSize: 12,
              letterSpacing: '0.15em',
              fontFamily: 'system-ui',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              borderRadius: 2,
            }}
          >
            {loading ? 'AUTHENTICATING...' : 'AUTHENTICATE'}
          </button>
        </form>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            margin: '20px 0',
          }}
        >
          <div style={{ flex: 1, height: 1, background: '#252525' }} />
          <span
            style={{
              color: '#4a4a4a',
              fontSize: 10,
              letterSpacing: '0.15em',
              fontFamily: 'system-ui',
            }}
          >
            OR
          </span>
          <div style={{ flex: 1, height: 1, background: '#252525' }} />
        </div>

        <button
          type="button"
          onClick={() => {
            window.location.href = '/api/express/auth/google'
          }}
          style={{
            width: '100%',
            background: '#181818',
            color: '#e2e2e2',
            border: '1px solid #252525',
            padding: '10px 0',
            fontSize: 12,
            letterSpacing: '0.15em',
            fontFamily: 'system-ui',
            fontWeight: 600,
            cursor: 'pointer',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.6l6.2 5.2C41.9 35.6 44 30.2 44 24c0-1.3-.1-2.3-.4-3.5z"/>
          </svg>
          SIGN IN WITH GOOGLE
        </button>
      </div>
    </div>
  )
}
