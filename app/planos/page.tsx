'use client'
import { useState } from "react";

export default function Planos() {
  const [recurrence, setRecurrence] = useState("monthly");

  const plans = [
    {
      id: 'free',
      name: 'FREE',
      price: 0,
      features: [
        'Universo do scan limitado ao Ibovespa.',
        'Ranking exibe apenas pares com score até 80.',
        'Indicador PRI não disponível.',
        'Educacional básico liberado (seções 1 a 7).',
        'Operations e Performance bloqueados.',
        'Configurações travadas nos valores padrão.',
      ],
    },
    {
      id: 'starter',
      name: 'STARTER',
      price: 49.99,
      features: [
        'Universo do scan: Ibovespa + ETFs.',
        'Ranking completo, score 0 a 100.',
        'Indicador PRI não disponível.',
        'Educacional básico liberado (seções 1 a 7).',
        'Operations liberado — registre e acompanhe suas operações.',
        'Performance básico liberado — métricas de P&L e histórico.',
        'Configurações parcialmente editáveis: Z-threshold e Lookback Window.',
      ],
    },
    {
      id: 'pro',
      name: 'PRO',
      price: 99.99,
      features: [
        'Universo do scan completo: Ibovespa, Ações B3, FIIs, ETFs e BDRs.',
        'Ranking completo, score 0 a 100.',
        'Indicador PRI liberado com todos os sub-indicadores (HRR, WBA, SS).',
        'Educacional completo, incluindo seção exclusiva sobre o PRI.',
        'Operations e Performance completos.',
        'Configurações totalmente editáveis, incluindo universo, liquidez mínima e caps por tipo de ativo.',
        'Alertas de sinal por e-mail — notificação quando um par favorito gerar sinal ativo.',
      ],
    },
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

  function formatPrice(price: number) {
    if (price === 0) return 'R$ 0';
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  }

  return (
    <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: 1080 }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ color: '#7a7a7a', fontSize: 11, letterSpacing: '0.15em', marginBottom: 6, fontFamily: 'system-ui', margin: '0 0 6px' }}>
            TERMINAL DE PESQUISA QUANTITATIVA
          </p>
          <h1 style={{ color: '#c8a96e', fontSize: 20, letterSpacing: '0.2em', fontFamily: '"JetBrains Mono", monospace', fontWeight: 600, margin: '0 0 4px' }}>
            PAIR<span style={{ color: '#e2e2e2' }}>LENS</span>
          </h1>
          <p style={{ color: '#4a4a4a', fontSize: 11, fontFamily: 'system-ui', letterSpacing: '0.1em', margin: 0 }}>
            SELECIONE O PLANO DE ASSINATURA
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
            MENSAL
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
            TRIMESTRAL
          </span>
        </div>

        {/* Plan cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {plans.map((plan) => (
            <div
              key={plan.id}
              style={{
                background: '#111',
                border: '1px solid #252525',
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <p style={{ color: '#4a4a4a', fontSize: 10, letterSpacing: '0.15em', fontFamily: 'system-ui', margin: '0 0 8px' }}>
                PLANO
              </p>
              <h3 style={{ color: '#c8a96e', fontSize: 16, letterSpacing: '0.2em', fontFamily: '"JetBrains Mono", monospace', fontWeight: 600, margin: '0 0 20px' }}>
                {plan.name}
              </h3>

              <div style={{ margin: '0 0 24px', borderBottom: '1px solid #1a1a1a', paddingBottom: 24 }}>
                <span className="mono" style={{ color: '#e2e2e2', fontSize: 28, fontWeight: 600 }}>
                  {formatPrice(plan.price)}
                </span>
                <span style={{ color: '#4a4a4a', fontSize: 11, fontFamily: 'system-ui', marginLeft: 6 }}>
                  / {isQuarterly ? 'TRIMESTRE' : 'MÊS'}
                </span>
              </div>

              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: '0 0 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                flex: 1,
              }}>
                {plan.features.map((feature, idx) => (
                  <li
                    key={idx}
                    style={{
                      color: '#b0b0b0',
                      fontSize: 12,
                      lineHeight: 1.5,
                      fontFamily: 'system-ui',
                      paddingLeft: 14,
                      position: 'relative',
                    }}
                  >
                    <span style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      color: '#c8a96e',
                    }}>
                      ›
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(plan)}
                disabled={plan.price === 0}
                style={{
                  width: '100%',
                  background: plan.price === 0 ? '#1a1a1a' : '#c8a96e',
                  color: plan.price === 0 ? '#4a4a4a' : '#080808',
                  border: plan.price === 0 ? '1px solid #252525' : 'none',
                  padding: '10px 0',
                  fontSize: 11,
                  letterSpacing: '0.15em',
                  fontFamily: 'system-ui',
                  fontWeight: 600,
                  cursor: plan.price === 0 ? 'default' : 'pointer',
                  borderRadius: 2,
                  transition: 'opacity 0.1s',
                }}
                onMouseEnter={e => { if (plan.price !== 0) e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={e => { if (plan.price !== 0) e.currentTarget.style.opacity = '1' }}
              >
                {plan.price === 0 ? 'PLANO ATUAL' : 'ASSINAR'}
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
