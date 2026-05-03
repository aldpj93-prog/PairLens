'use client'
import Link from "next/link";

export default function PagamentoFalha() {
  return (
    <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        <div style={{ marginBottom: 32 }}>
          <p style={{ color: '#7a7a7a', fontSize: 11, letterSpacing: '0.15em', marginBottom: 6, fontFamily: 'system-ui', margin: '0 0 6px' }}>
            TERMINAL DE PESQUISA QUANTITATIVA
          </p>
          <h1 style={{ color: '#c8a96e', fontSize: 20, letterSpacing: '0.2em', fontFamily: '"JetBrains Mono", monospace', fontWeight: 600, margin: '0 0 4px' }}>
            PAIR<span style={{ color: '#e2e2e2' }}>LENS</span>
          </h1>
          <p style={{ color: '#4a4a4a', fontSize: 11, fontFamily: 'system-ui', letterSpacing: '0.1em', margin: 0 }}>
            CONFIRMAÇÃO DE PAGAMENTO
          </p>
        </div>

        <div style={{ background: '#111', border: '1px solid #252525', padding: '36px 28px' }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: '#a8323222',
            border: '1px solid #a8323266',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c87070" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>

          <p style={{ color: '#4a4a4a', fontSize: 10, letterSpacing: '0.15em', fontFamily: 'system-ui', margin: '0 0 8px' }}>
            STATUS
          </p>
          <h2 style={{ color: '#e2e2e2', fontSize: 18, letterSpacing: '0.15em', fontFamily: '"JetBrains Mono", monospace', fontWeight: 600, margin: '0 0 16px' }}>
            PAGAMENTO RECUSADO
          </h2>
          <p style={{ color: '#7a7a7a', fontSize: 13, fontFamily: 'system-ui', lineHeight: 1.6, margin: '0 0 28px' }}>
            Não foi possível processar sua assinatura. Verifique os dados do seu cartão e tente novamente.
          </p>

          <Link href="/planos" style={{ textDecoration: 'none' }}>
            <button
              style={{
                width: '100%',
                background: '#c8a96e',
                color: '#080808',
                border: 'none',
                padding: '10px 0',
                fontSize: 11,
                letterSpacing: '0.15em',
                fontFamily: 'system-ui',
                fontWeight: 600,
                cursor: 'pointer',
                borderRadius: 2,
                transition: 'opacity 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              TENTAR NOVAMENTE
            </button>
          </Link>
        </div>

      </div>
    </div>
  )
}
