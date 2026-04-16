'use client'
import { useState } from "react";

export default function Planos() {
  const [recurrence, setRecurrence] = useState("monthly");

  const plans = [
    {
      id: 'pro',
      name: 'PRO',
      price: 29,
    },
    {
      id: 'super',
      name: 'SUPER',
      price: 120,
    }
  ]

  function handleToggle() {
    const next = recurrence === 'monthly' ? 'quarterly' : 'monthly';
    setRecurrence(next);
  }

  async function handleSelectPlan(plan: any) {
    const payload = {
      planId: plan.id,
      recurrence: recurrence,
    }
    const response = await fetch('api/express/pay', {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const data = await response.json();
    window.location.href = data.url;
  }

  const isQuarterly = recurrence === 'quarterly';

  return (
    <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: 680 }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ color: '#7a7a7a', fontSize: 11, letterSpacing: '0.15em', marginBottom: 6, fontFamily: 'system-ui', margin: '0 0 6px' }}>
            QUANTITATIVE RESEARCH TERMINAL
          </p>
          <h1 style={{ color: '#c8a96e', fontSize: 20, letterSpacing: '0.2em', fontFamily: '"JetBrains Mono", monospace', fontWeight: 600, margin: '0 0 4px' }}>
            PAIR<span style={{ color: '#e2e2e2' }}>LENS</span>
          </h1>
          <p style={{ color: '#4a4a4a', fontSize: 11, fontFamily: 'system-ui', letterSpacing: '0.1em', margin: 0 }}>
            SELECT SUBSCRIPTION PLAN
          </p>
        </div>

        {/* Billing toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <span style={{
            color: !isQuarterly ? '#e2e2e2' : '#4a4a4a',
            fontSize: 11,
            letterSpacing: '0.12em',
            fontFamily: 'system-ui',
            transition: 'color 0.15s',
          }}>
            MONTHLY
          </span>
          <button
            onClick={handleToggle}
            aria-label="Toggle billing period"
            style={{
              position: 'relative',
              width: 44,
              height: 24,
              borderRadius: 12,
              background: isQuarterly ? '#c8a96e33' : '#1a1a1a',
              border: `1px solid ${isQuarterly ? '#c8a96e66' : '#333'}`,
              cursor: 'pointer',
              padding: 0,
              transition: 'background 0.2s, border-color 0.2s',
            }}
          >
            <div style={{
              position: 'absolute',
              top: 2,
              left: 2,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: isQuarterly ? '#c8a96e' : '#555',
              transition: 'transform 0.2s, background 0.2s',
              transform: isQuarterly ? 'translateX(20px)' : 'translateX(0px)',
            }} />
          </button>
          <span style={{
            color: isQuarterly ? '#e2e2e2' : '#4a4a4a',
            fontSize: 11,
            letterSpacing: '0.12em',
            fontFamily: 'system-ui',
            transition: 'color 0.15s',
          }}>
            QUARTERLY
          </span>
        </div>

        {/* Plan cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {plans.map((plan) => (
            <div
              key={plan.id}
              style={{
                background: '#111',
                border: '1px solid #252525',
                padding: '28px 24px',
              }}
            >
              <p style={{ color: '#4a4a4a', fontSize: 10, letterSpacing: '0.15em', fontFamily: 'system-ui', margin: '0 0 8px' }}>
                PLAN
              </p>
              <h3 style={{ color: '#c8a96e', fontSize: 16, letterSpacing: '0.2em', fontFamily: '"JetBrains Mono", monospace', fontWeight: 600, margin: '0 0 20px' }}>
                {plan.name}
              </h3>

              <div style={{ margin: '0 0 28px', borderBottom: '1px solid #1a1a1a', paddingBottom: 24 }}>
                <span className="mono" style={{ color: '#e2e2e2', fontSize: 30, fontWeight: 600 }}>
                  R$ {plan.price}
                </span>
                <span style={{ color: '#4a4a4a', fontSize: 11, fontFamily: 'system-ui', marginLeft: 6 }}>
                  / {isQuarterly ? 'QUARTER' : 'MONTH'}
                </span>
              </div>

              <button
                onClick={() => handleSelectPlan(plan)}
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
                ASSINAR
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
