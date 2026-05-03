'use client'

import { useState, FormEvent } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function signUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    //setLoading(true)
    //console.log(email, password)
    const response = await fetch('/api/express/auth/cadastro', {
      headers:{
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({email, name, password})
    });

    console.log(response);

    //router.push('/dashboard')
    //router.refresh()
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
            TERMINAL DE PESQUISA QUANTITATIVA
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
            ACESSO RESTRITO
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
          </div>          <div className="mb-4">
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
              NOME
            </label>
            <input
              id="name"
              type="name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoComplete="name"
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
              SENHA
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
            {loading ? 'CADASTRANDO...' : 'CADASTRAR'}
          </button>
        </form>
      </div>
    </div>
  )
}
