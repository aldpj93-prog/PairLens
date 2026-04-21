export default function EducationPage() {
  const gold   = '#d4b87a'
  const dim    = '#8a8a8a'
  const mid    = '#a0a0a0'
  const light  = '#f5f5f5'
  const body   = '#a0a0a0'
  const card   = '#1f1f1f'
  const border = '#2e2e2e'
  const mono   = '"JetBrains Mono", monospace'
  const sans   = 'system-ui, sans-serif'

  const Section = ({ id, title, sub, children }: { id?: string; title: string; sub?: string; children: React.ReactNode }) => (
    <section id={id} style={{ marginBottom: 64 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 11, letterSpacing: '0.15em', color: gold, fontFamily: sans, fontWeight: 600, margin: '0 0 6px', textTransform: 'uppercase' }}>{title}</h2>
        {sub && <p style={{ fontSize: 22, color: light, fontFamily: sans, fontWeight: 300, margin: 0, lineHeight: 1.3 }}>{sub}</p>}
      </div>
      {children}
    </section>
  )

  const P = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <p style={{ fontSize: 14, color: body, fontFamily: sans, lineHeight: 1.8, margin: '0 0 16px', ...style }}>{children}</p>
  )

  const Formula = ({ children }: { children: React.ReactNode }) => (
    <div style={{ background: '#1f1f1f', border: `1px solid ${border}`, borderLeft: `3px solid ${gold}`, borderRadius: 2, padding: '12px 20px', margin: '16px 0', fontFamily: mono, fontSize: 13, color: light, letterSpacing: '0.05em' }}>
      {children}
    </div>
  )

  const Callout = ({ color = gold, children }: { color?: string; children: React.ReactNode }) => (
    <div style={{ background: '#1f1f1f', border: `1px solid ${border}`, borderLeft: `3px solid ${color}`, borderRadius: 2, padding: '14px 18px', margin: '16px 0' }}>
      <p style={{ fontSize: 13, color: body, fontFamily: sans, lineHeight: 1.7, margin: 0 }}>{children}</p>
    </div>
  )

  const Badge = ({ label, value, accent }: { label: string; value: string; accent?: boolean }) => (
    <div style={{ background: '#2a2a2a', border: `1px solid ${accent ? '#2a2a1a' : border}`, borderRadius: 2, padding: '10px 14px', minWidth: 130 }}>
      <p style={{ fontSize: 9, letterSpacing: '0.1em', color: dim, fontFamily: sans, margin: '0 0 4px', textTransform: 'uppercase' }}>{label}</p>
      <p style={{ fontSize: 16, color: accent ? gold : light, fontFamily: mono, margin: 0, fontWeight: 600 }}>{value}</p>
    </div>
  )

  // ── SVG: dois preços cointegrados se movendo juntos ──────────────────────
  const SvgCointegration = () => {
    const w = 680; const h = 160; const px = 30; const py = 20
    const n = 50
    // Simulated price paths that share a common trend
    const seed = [0,1,-1,2,0,-1,1,3,2,1,0,-2,-1,0,1,2,3,2,1,0,-1,-2,-1,0,1,2,1,0,-1,0,1,2,3,2,1,0,-1,-2,-1,0,1,0,-1,0,1,2,1,0,-1,0]
    const baseA: number[] = []; const baseB: number[] = []
    let va = 100; let vb = 100
    seed.forEach((s, i) => {
      va += s * 0.8 + 0.1
      vb += s * 0.7 + (i % 7 === 0 ? 1.5 : -0.2)
      baseA.push(va); baseB.push(vb)
    })
    const allVals = [...baseA, ...baseB]
    const minV = Math.min(...allVals); const maxV = Math.max(...allVals)
    const scaleX = (i: number) => px + (i / (n - 1)) * (w - 2 * px)
    const scaleY = (v: number) => py + (1 - (v - minV) / (maxV - minV)) * (h - 2 * py)
    const pathA = baseA.map((v, i) => `${i === 0 ? 'M' : 'L'}${scaleX(i).toFixed(1)},${scaleY(v).toFixed(1)}`).join(' ')
    const pathB = baseB.map((v, i) => `${i === 0 ? 'M' : 'L'}${scaleX(i).toFixed(1)},${scaleY(v).toFixed(1)}`).join(' ')
    return (
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', borderRadius: 2 }}>
        <rect width={w} height={h} fill="#1f1f1f" rx="2" />
        <path d={pathA} fill="none" stroke={gold} strokeWidth="2" />
        <path d={pathB} fill="none" stroke="#6a9eb5" strokeWidth="2" />
        <text x={px + 4} y={py + 12} fill={gold} fontSize="10" fontFamily="system-ui">ATIVO A</text>
        <text x={px + 70} y={py + 12} fill="#6a9eb5" fontSize="10" fontFamily="system-ui">ATIVO B</text>
      </svg>
    )
  }

  // ── SVG: spread oscilando em torno de zero ───────────────────────────────
  const SvgSpread = () => {
    const w = 680; const h = 160; const px = 30; const py = 20
    const vals = [0.1,-0.3,0.5,1.0,1.4,1.8,1.5,1.0,0.5,0.1,-0.4,-0.8,-1.2,-1.5,-1.3,-0.9,-0.4,0.1,0.5,0.9,1.2,1.6,1.9,1.5,1.0,0.5,0.0,-0.5,-1.0,-1.4,-1.7,-1.4,-1.0,-0.5,0.0,0.4,0.8,1.2,1.5,1.8,1.4,0.9,0.4,0.0,-0.4,-0.8,-1.1,-0.7,-0.3,0.1]
    const sigma = 1.8
    const minV = -sigma - 0.2; const maxV = sigma + 0.2
    const scaleX = (i: number) => px + (i / (vals.length - 1)) * (w - 2 * px)
    const scaleY = (v: number) => py + (1 - (v - minV) / (maxV - minV)) * (h - 2 * py)
    const path = vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${scaleX(i).toFixed(1)},${scaleY(v).toFixed(1)}`).join(' ')
    const y0   = scaleY(0)
    const yPos = scaleY(sigma)
    const yNeg = scaleY(-sigma)
    return (
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', borderRadius: 2 }}>
        <rect width={w} height={h} fill="#1f1f1f" rx="2" />
        <rect x={px} y={yPos} width={w - 2 * px} height={yNeg - yPos} fill="rgba(74,124,89,0.06)" />
        <line x1={px} y1={yPos} x2={w - px} y2={yPos} stroke="#4a7c59" strokeWidth="1" strokeDasharray="4 3" />
        <line x1={px} y1={yNeg} x2={w - px} y2={yNeg} stroke="#8c3f3f" strokeWidth="1" strokeDasharray="4 3" />
        <line x1={px} y1={y0}   x2={w - px} y2={y0}   stroke={dim}    strokeWidth="1" strokeDasharray="2 3" />
        <path d={path} fill="none" stroke={gold} strokeWidth="2" />
        <text x={w - px - 2} y={yPos - 4}  fill="#4a7c59" fontSize="9" fontFamily="system-ui" textAnchor="end">+1σ  SHORT</text>
        <text x={w - px - 2} y={yNeg + 12} fill="#8c3f3f" fontSize="9" fontFamily="system-ui" textAnchor="end">-1σ  LONG</text>
        <text x={w - px - 2} y={y0 - 4}    fill={dim}     fontSize="9" fontFamily="system-ui" textAnchor="end">média</text>
      </svg>
    )
  }

  // ── SVG: z-score com zonas de entrada ────────────────────────────────────
  const SvgZScore = () => {
    const w = 680; const h = 180; const px = 30; const py = 20
    const vals = [0.2,-0.4,0.6,1.1,1.6,2.1,2.6,3.1,2.7,2.2,1.7,1.1,0.5,0.0,-0.5,-1.0,-1.6,-2.1,-2.6,-3.0,-2.5,-2.0,-1.5,-1.0,-0.4,0.1,0.6,1.1,1.5,2.0,2.4,2.8,2.4,1.9,1.4,0.9,0.3,-0.2,-0.7,-1.2,-1.7,-2.2,-2.6,-2.2,-1.7,-1.1,-0.5,0.1,0.6,1.0]
    const thr = 2.0
    const minV = -3.3; const maxV = 3.3
    const scaleX = (i: number) => px + (i / (vals.length - 1)) * (w - 2 * px)
    const scaleY = (v: number) => py + (1 - (v - minV) / (maxV - minV)) * (h - 2 * py)
    const yPos  = scaleY(thr)
    const yNeg  = scaleY(-thr)
    const y0    = scaleY(0)
    // Build colored path segments
    const points = vals.map((v, i) => ({ x: scaleX(i), y: scaleY(v), v }))
    const path   = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
    // Entry dots
    const entryDots = points.filter(p => Math.abs(p.v) > thr)
    return (
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', borderRadius: 2 }}>
        <rect width={w} height={h} fill="#1f1f1f" rx="2" />
        {/* zones */}
        <rect x={px} y={py}   width={w - 2 * px} height={yPos - py}   fill="rgba(140,63,63,0.07)" />
        <rect x={px} y={yNeg} width={w - 2 * px} height={h - py - yNeg} fill="rgba(74,124,89,0.07)" />
        {/* threshold lines */}
        <line x1={px} y1={yPos} x2={w - px} y2={yPos} stroke="#8c3f3f" strokeWidth="1" strokeDasharray="4 3" />
        <line x1={px} y1={yNeg} x2={w - px} y2={yNeg} stroke="#4a7c59" strokeWidth="1" strokeDasharray="4 3" />
        <line x1={px} y1={y0}   x2={w - px} y2={y0}   stroke={dim}    strokeWidth="1" strokeDasharray="2 3" />
        {/* z-score line */}
        <path d={path} fill="none" stroke={gold} strokeWidth="2" />
        {/* entry dots */}
        {entryDots.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3.5"
            fill={p.v > 0 ? '#8c3f3f' : '#4a7c59'}
            stroke="none" opacity="0.9" />
        ))}
        {/* labels */}
        <text x={w - px - 2} y={yPos - 5}  fill="#8c3f3f" fontSize="9" fontFamily="system-ui" textAnchor="end">+2  ENTRADA SHORT SPREAD</text>
        <text x={w - px - 2} y={yNeg + 13} fill="#4a7c59" fontSize="9" fontFamily="system-ui" textAnchor="end">-2  ENTRADA LONG SPREAD</text>
        <text x={w - px - 2} y={y0  - 5}   fill={dim}     fontSize="9" fontFamily="system-ui" textAnchor="end">0  saída / meta</text>
      </svg>
    )
  }

  // ── SVG: distribuição normal com z marcado ───────────────────────────────
  const SvgNormalDist = () => {
    const w = 400; const h = 140; const cx = 200; const py = 16
    // Normal curve approximation
    const points: string[] = []
    for (let i = 0; i <= 200; i++) {
      const x = -3.5 + (7 * i) / 200
      const y = Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)
      const sx = cx + (x / 3.5) * 165
      const sy = py + (1 - y / 0.4) * (h - py - 20) + 8
      points.push(`${i === 0 ? 'M' : 'L'}${sx.toFixed(1)},${sy.toFixed(1)}`)
    }
    const path = points.join(' ')
    const yBase = py + (h - py - 20) + 8
    const zx = cx + (2.5 / 3.5) * 165
    const zy = py + (1 - (Math.exp(-0.5 * 6.25) / Math.sqrt(2 * Math.PI)) / 0.4) * (h - py - 20) + 8
    return (
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', borderRadius: 2 }}>
        <rect width={w} height={h} fill="#1f1f1f" rx="2" />
        <path d={path} fill="none" stroke={mid} strokeWidth="1.5" />
        {/* sigma markers */}
        {[-2,-1,0,1,2].map(s => {
          const sx = cx + (s / 3.5) * 165
          return <g key={s}>
            <line x1={sx} y1={yBase - 4} x2={sx} y2={yBase + 4} stroke={dim} strokeWidth="1" />
            <text x={sx} y={yBase + 14} fill={dim} fontSize="9" fontFamily="system-ui" textAnchor="middle">{s}σ</text>
          </g>
        })}
        {/* shade outside ±2σ */}
        <path d={`M${cx + (2/3.5)*165},${py+8} ${points.filter((_, i) => i >= 143 && i <= 200).join(' ')} L${cx+(3.5/3.5)*165},${yBase} Z`}
          fill="rgba(140,63,63,0.15)" />
        <path d={`M${cx - (3.5/3.5)*165},${yBase} ${points.filter((_, i) => i <= 57).join(' ')} L${cx-(2/3.5)*165},${yBase} Z`}
          fill="rgba(74,124,89,0.15)" />
        {/* z marker */}
        <circle cx={zx} cy={zy} r="5" fill={gold} />
        <line x1={zx} y1={zy + 6} x2={zx} y2={yBase} stroke={gold} strokeWidth="1" strokeDasharray="3 2" />
        <text x={zx + 8} y={zy + 4} fill={gold} fontSize="10" fontFamily="system-ui">Z = 2.5</text>
        <text x={cx + (2/3.5)*165 + 2} y={py + 24} fill="#8c3f3f" fontSize="9" fontFamily="system-ui">5% dos casos</text>
      </svg>
    )
  }

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Cabeçalho */}
      <div style={{ marginBottom: 48 }}>
        <h1 style={{ fontSize: 11, letterSpacing: '0.18em', color: gold, fontFamily: sans, fontWeight: 600, margin: '0 0 8px', textTransform: 'uppercase' }}>
          GUIA COMPLETO
        </h1>
        <p style={{ fontSize: 28, color: light, fontFamily: sans, fontWeight: 300, margin: '0 0 12px', lineHeight: 1.2 }}>
          Como a PairLens encontra e avalia pares cointegrados
        </p>
        <p style={{ fontSize: 14, color: mid, fontFamily: sans, margin: 0, lineHeight: 1.7 }}>
          Do zero à operação. Tudo que você precisa saber sobre a metodologia, os indicadores e como interpretar cada número que a plataforma gera.
        </p>
      </div>

      {/* Índice */}
      <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 2, padding: '16px 20px', marginBottom: 52 }}>
        <p style={{ fontSize: 10, letterSpacing: '0.12em', color: dim, fontFamily: sans, margin: '0 0 10px', textTransform: 'uppercase' }}>Neste guia</p>
        {[
          ['1', 'O que é arbitragem estatística?'],
          ['2', 'O que é um par cointegrado?'],
          ['3', 'O spread e a reversão à média'],
          ['4', 'O Teste ADF — a prova matemática'],
          ['5', 'O Z-Score — o semáforo da operação'],
          ['6', 'A operação Long-Short na prática'],
          ['7', 'Como a PairLens funciona por dentro'],
          ['8', 'Glossário completo dos indicadores'],
        ].map(([n, label]) => (
          <div key={n} style={{ display: 'flex', gap: 12, alignItems: 'baseline', padding: '4px 0', borderBottom: `1px solid #141414` }}>
            <span style={{ fontSize: 10, color: gold, fontFamily: mono, minWidth: 14 }}>{n}</span>
            <span style={{ fontSize: 13, color: mid, fontFamily: sans }}>{label}</span>
          </div>
        ))}
      </div>

      {/* ── 1. Arbitragem estatística ── */}
      <Section title="1. Contexto" sub="O que é arbitragem estatística?">
        <P>Imagine dois ativos que, historicamente, sempre andaram juntos. Quando um sobe, o outro sobe junto. Quando um cai, o outro acompanha. Isso não é coincidência — pode ser que as duas empresas operem no mesmo setor, dependam do mesmo insumo ou sejam simplesmente versões diferentes da mesma ação (como PETR3 e PETR4).</P>
        <P>Vez ou outra, por algum desequilíbrio temporário no mercado, um deles se afasta mais do que o normal do outro. A premissa da arbitragem estatística é simples: <strong style={{ color: light }}>se eles sempre andaram juntos, essa distância vai se fechar</strong>.</P>
        <P>A diferença em relação à análise técnica clássica é que aqui não apostamos na direção de um ativo individual — apostamos no <em>relacionamento entre dois ativos</em>. Isso torna a estratégia muito menos dependente do humor geral do mercado.</P>
        <Callout>
          Em vez de perguntar "VALE3 vai subir ou cair?", perguntamos "VALE3 está anormalmente barata ou cara em relação a CSNA3?". A resposta a essa segunda pergunta é muito mais previsível.
        </Callout>
      </Section>

      {/* ── 2. Par cointegrado ── */}
      <Section title="2. O conceito central" sub="O que é um par cointegrado?">
        <P>Dois ativos são <strong style={{ color: light }}>cointegrados</strong> quando existe uma combinação entre eles que é estatisticamente estável ao longo do tempo — ou seja, embora cada um isoladamente possa subir ou cair, a <em>diferença ajustada entre os dois</em> fica presa num corredor.</P>
        <P>O gráfico abaixo mostra dois ativos cointegrados. Perceba como eles se afastam e se reaproximam repetidamente:</P>
        <div style={{ margin: '20px 0', borderRadius: 2, overflow: 'hidden', border: `1px solid ${border}` }}>
          <SvgCointegration />
        </div>
        <P>Essa relação é descrita matematicamente por uma equação simples:</P>
        <Formula>
          Spread<sub>t</sub> = Preço_A<sub>t</sub> &minus; &beta; &times; Preço_B<sub>t</sub>
        </Formula>
        <P>O <strong style={{ color: gold }}>beta (β)</strong> — chamado de Hedge Ratio — é o coeficiente que calibra o quanto de B precisamos para equilibrar cada unidade de A. Ele é calculado por regressão linear (método OLS).</P>
        <P>Com o β correto, o spread oscila em torno de uma média estável em vez de derivar para o infinito. Isso é o que chamamos de processo <strong style={{ color: light }}>estacionário</strong>.</P>
      </Section>

      {/* ── 3. O spread ── */}
      <Section title="3. A distância entre eles" sub="O spread e a reversão à média">
        <P>Depois de calcular o spread, observamos algo muito valioso: ele tem comportamento previsível. O gráfico abaixo mostra um spread típico de um par cointegrado — oscilando em torno de zero, sempre retornando:</P>
        <div style={{ margin: '20px 0', borderRadius: 2, overflow: 'hidden', border: `1px solid ${border}` }}>
          <SvgSpread />
        </div>
        <P>Três propriedades definem esse comportamento:</P>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '16px 0' }}>
          {[
            ['Média constante', 'O spread flutua em torno de um valor central (geralmente próximo de zero após normalização). Ele não tem tendência de longo prazo.'],
            ['Desvio padrão estável', 'A amplitude das oscilações é previsível. A maior parte do tempo, o spread fica dentro de ±1 a 2 desvios padrão da média.'],
            ['Reversão à média', 'Quando o spread se afasta demais, ele tende a retornar. Isso é o que cria a oportunidade de operação.'],
          ].map(([title, text]) => (
            <div key={title} style={{ display: 'flex', gap: 12, background: '#1f1f1f', border: `1px solid ${border}`, borderRadius: 2, padding: '12px 16px' }}>
              <span style={{ color: gold, fontFamily: mono, fontSize: 18, lineHeight: 1, marginTop: 2 }}>&#8594;</span>
              <div>
                <p style={{ fontSize: 12, color: light, fontFamily: sans, fontWeight: 600, margin: '0 0 4px', letterSpacing: '0.05em' }}>{title}</p>
                <p style={{ fontSize: 13, color: body, fontFamily: sans, margin: 0, lineHeight: 1.6 }}>{text}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 4. ADF test ── */}
      <Section title="4. A prova matemática" sub="O Teste ADF — Augmented Dickey-Fuller">
        <P>Até aqui falamos de intuição. Mas antes de operar, precisamos de evidência estatística de que a reversão à média é real e não apenas aparência. É aí que entra o <strong style={{ color: light }}>Teste ADF</strong>.</P>
        <P>O ADF é um teste de hipótese que verifica se o spread é de fato estacionário. Ele funciona assim:</P>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: '16px 0' }}>
          <div style={{ background: '#1f1f1f', border: `1px solid #1a2a1a`, borderRadius: 2, padding: '14px 16px' }}>
            <p style={{ fontSize: 10, color: dim, letterSpacing: '0.1em', fontFamily: sans, margin: '0 0 6px', textTransform: 'uppercase' }}>Hipótese nula (H₀)</p>
            <p style={{ fontSize: 13, color: body, fontFamily: sans, margin: 0, lineHeight: 1.6 }}>O spread tem <strong style={{ color: light }}>raiz unitária</strong> — ele deriva sem limite e não reverte à média. O par <em>não</em> é operável.</p>
          </div>
          <div style={{ background: '#1f1f1f', border: `1px solid #1a2a1a`, borderRadius: 2, padding: '14px 16px' }}>
            <p style={{ fontSize: 10, color: dim, letterSpacing: '0.1em', fontFamily: sans, margin: '0 0 6px', textTransform: 'uppercase' }}>Hipótese alternativa (H₁)</p>
            <p style={{ fontSize: 13, color: body, fontFamily: sans, margin: 0, lineHeight: 1.6 }}>O spread é <strong style={{ color: light }}>estacionário</strong> — ele reverte à média. O par é cointegrado e operável.</p>
          </div>
        </div>
        <P>O teste produz dois números que aparecem na tabela de pares:</P>
        <div style={{ margin: '16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '12px 16px', background: '#1f1f1f', border: `1px solid ${border}`, borderRadius: 2 }}>
            <span style={{ color: gold, fontFamily: mono, fontSize: 13, minWidth: 100 }}>ADF STAT</span>
            <p style={{ fontSize: 13, color: body, fontFamily: sans, margin: 0, lineHeight: 1.6 }}>A estatística do teste. <strong style={{ color: light }}>Quanto mais negativa, melhor.</strong> Valores abaixo de -3.5 são considerados fortes. Indica a velocidade de reversão do spread.</p>
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '12px 16px', background: '#1f1f1f', border: `1px solid ${border}`, borderRadius: 2 }}>
            <span style={{ color: gold, fontFamily: mono, fontSize: 13, minWidth: 100 }}>p-VALUE</span>
            <p style={{ fontSize: 13, color: body, fontFamily: sans, margin: 0, lineHeight: 1.6 }}>A probabilidade de estarmos errados ao afirmar que o par é cointegrado. <strong style={{ color: light }}>Quanto menor, melhor.</strong> A plataforma exige p &lt; 0.10 para listar um par. O ideal é p &lt; 0.05.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '16px 0' }}>
          {[
            { label: 'p-value 0.001', value: '99.9% confiança', color: '#4a7c59' },
            { label: 'p-value 0.010', value: '99.0% confiança', color: '#4a7c59' },
            { label: 'p-value 0.050', value: '95.0% confiança', color: gold },
            { label: 'p-value 0.100', value: '90.0% confiança — limite', color: '#7a6a3a' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: '#1f1f1f', border: `1px solid ${border}`, borderRadius: 2, padding: '8px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: mid, fontFamily: mono }}>{label}</span>
              <span style={{ fontSize: 11, color, fontFamily: sans, fontWeight: 600 }}>{value}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 5. Z-Score ── */}
      <Section title="5. O semáforo da operação" sub="O Z-Score — quando entrar?">
        <P>Saber que o par é cointegrado é o primeiro passo. O segundo passo é saber <em>quando</em> o spread está suficientemente distante para justificar uma operação. Para isso usamos o <strong style={{ color: light }}>Z-Score</strong>.</P>
        <Formula>
          Z-Score = (Spread<sub>atual</sub> &minus; Média<sub>spread</sub>) &divide; Desvio_Padrão<sub>spread</sub>
        </Formula>
        <P>O Z-Score responde: "quantos desvios padrão o spread atual está da sua média histórica?" Na curva normal abaixo, o ponto dourado mostra onde Z = 2.5:</P>
        <div style={{ margin: '20px 0', borderRadius: 2, overflow: 'hidden', border: `1px solid ${border}`, maxWidth: 420 }}>
          <SvgNormalDist />
        </div>
        <P>Quando o spread está em Z = +2.5, ele está numa região que ocorre em menos de 5% das vezes. Isso é raro o suficiente para apostamos na reversão.</P>
        <P>O gráfico abaixo mostra o Z-Score ao longo do tempo. Os pontos coloridos marcam os momentos onde a plataforma geraria um sinal:</P>
        <div style={{ margin: '20px 0', borderRadius: 2, overflow: 'hidden', border: `1px solid ${border}` }}>
          <SvgZScore />
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', margin: '16px 0' }}>
          {[
            { z: 'Z > +2', label: 'SHORT SPREAD', bg: 'rgba(140,63,63,0.12)', border2: '#5a2a2a', desc: 'Spread alto demais. A espera é que caia.' },
            { z: 'Z entre -2 e +2', label: 'NEUTRAL', bg: 'rgba(74,74,74,0.12)', border2: '#2a2a2a', desc: 'Spread dentro do normal. Sem oportunidade clara.' },
            { z: 'Z < -2', label: 'LONG SPREAD', bg: 'rgba(74,124,89,0.12)', border2: '#2a4a3a', desc: 'Spread baixo demais. A espera é que suba.' },
          ].map(({ z, label, bg, border2, desc }) => (
            <div key={z} style={{ flex: 1, minWidth: 180, background: bg, border: `1px solid ${border2}`, borderRadius: 2, padding: '12px 14px' }}>
              <p style={{ fontSize: 11, color: mid, fontFamily: mono, margin: '0 0 4px' }}>{z}</p>
              <p style={{ fontSize: 12, color: light, fontFamily: sans, fontWeight: 600, margin: '0 0 6px', letterSpacing: '0.05em' }}>{label}</p>
              <p style={{ fontSize: 12, color: body, fontFamily: sans, margin: 0, lineHeight: 1.5 }}>{desc}</p>
            </div>
          ))}
        </div>
        <Callout>
          A PairLens calcula o Z-Score com uma janela móvel de 60 dias de negociação. Isso significa que a média e o desvio padrão são atualizados continuamente com os dados mais recentes, tornando o indicador adaptativo às mudanças do mercado.
        </Callout>
      </Section>

      {/* ── 6. Long-Short ── */}
      <Section title="6. Colocando em prática" sub="A operação Long-Short passo a passo">
        <P>Com um par cointegrado identificado e um Z-Score extremo detectado, a operação é direta. O princípio é sempre o mesmo: você aposta no fechamento do spread, independente do que o mercado fizer como um todo.</P>

        {/* SHORT SPREAD */}
        <div style={{ background: '#1f1f1f', border: `1px solid #2a1a1a`, borderLeft: `3px solid #8c3f3f`, borderRadius: 2, padding: '16px 20px', margin: '20px 0' }}>
          <p style={{ fontSize: 12, color: '#8c3f3f', fontFamily: sans, fontWeight: 600, letterSpacing: '0.1em', margin: '0 0 10px', textTransform: 'uppercase' }}>SHORT SPREAD — quando Z alto (acima de +2)</p>
          <p style={{ fontSize: 13, color: body, fontFamily: sans, lineHeight: 1.7, margin: '0 0 10px' }}>O ativo A está caro demais em relação ao B. O spread vai se fechar, provavelmente com A caindo e/ou B subindo.</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ background: '#1a1010', border: '1px solid #3a1a1a', borderRadius: 2, padding: '8px 14px' }}>
              <p style={{ fontSize: 10, color: dim, fontFamily: sans, margin: '0 0 4px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Ação A</p>
              <p style={{ fontSize: 13, color: '#c87070', fontFamily: mono, margin: 0, fontWeight: 600 }}>VENDER (short) &nbsp; proporcional a 1 unidade</p>
            </div>
            <div style={{ background: '#101a10', border: '1px solid #1a3a1a', borderRadius: 2, padding: '8px 14px' }}>
              <p style={{ fontSize: 10, color: dim, fontFamily: sans, margin: '0 0 4px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Ativo B</p>
              <p style={{ fontSize: 13, color: '#70c870', fontFamily: mono, margin: 0, fontWeight: 600 }}>COMPRAR (long) &nbsp; proporcional a &beta; unidades</p>
            </div>
          </div>
          <p style={{ fontSize: 12, color: dim, fontFamily: sans, margin: '10px 0 0', fontStyle: 'italic' }}>Saída: Z retorna a 0. Stop: Z ultrapassa +3.5.</p>
        </div>

        {/* LONG SPREAD */}
        <div style={{ background: '#1f1f1f', border: `1px solid #1a2a1a`, borderLeft: `3px solid #4a7c59`, borderRadius: 2, padding: '16px 20px', margin: '20px 0' }}>
          <p style={{ fontSize: 12, color: '#4a7c59', fontFamily: sans, fontWeight: 600, letterSpacing: '0.1em', margin: '0 0 10px', textTransform: 'uppercase' }}>LONG SPREAD — quando Z baixo (abaixo de -2)</p>
          <p style={{ fontSize: 13, color: body, fontFamily: sans, lineHeight: 1.7, margin: '0 0 10px' }}>O ativo A está barato demais em relação ao B. O spread vai se fechar, provavelmente com A subindo e/ou B caindo.</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ background: '#101a10', border: '1px solid #1a3a1a', borderRadius: 2, padding: '8px 14px' }}>
              <p style={{ fontSize: 10, color: dim, fontFamily: sans, margin: '0 0 4px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Ativo A</p>
              <p style={{ fontSize: 13, color: '#70c870', fontFamily: mono, margin: 0, fontWeight: 600 }}>COMPRAR (long) &nbsp; proporcional a 1 unidade</p>
            </div>
            <div style={{ background: '#1a1010', border: '1px solid #3a1a1a', borderRadius: 2, padding: '8px 14px' }}>
              <p style={{ fontSize: 10, color: dim, fontFamily: sans, margin: '0 0 4px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Ativo B</p>
              <p style={{ fontSize: 13, color: '#c87070', fontFamily: mono, margin: 0, fontWeight: 600 }}>VENDER (short) &nbsp; proporcional a &beta; unidades</p>
            </div>
          </div>
          <p style={{ fontSize: 12, color: dim, fontFamily: sans, margin: '10px 0 0', fontStyle: 'italic' }}>Saída: Z retorna a 0. Stop: Z ultrapassa -3.5.</p>
        </div>

        <Callout color="#6a9eb5">
          O Hedge Ratio β é crucial aqui. Ele garante que as duas pontas da operação tenham o mesmo "peso" em termos de risco. Se β = 0.8, para cada R$ 10.000 short em A você compra R$ 8.000 de B. A exposição líquida ao mercado é próxima de zero.
        </Callout>
      </Section>

      {/* ── 7. Como a plataforma funciona ── */}
      <Section title="7. Por dentro da plataforma" sub="Do dado bruto ao sinal: o fluxo completo">
        <P>A PairLens automatiza todo o processo que levaria horas para ser feito manualmente. Veja o que acontece cada vez que você clica em "RUN SCAN NOW":</P>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, margin: '20px 0' }}>
          {[
            { n: '01', title: 'Monta o universo de ativos', desc: 'Carrega a lista de tickers da B3 (Ibovespa ou universo completo, dependendo da configuração). Classifica cada ativo como Ação, FII, ETF ou BDR.' },
            { n: '02', title: 'Baixa 1 ano de histórico diário', desc: 'Para cada ticker, busca 252 pregões de preço de fechamento via Yahoo Finance. Tickers sem dados suficientes são descartados.' },
            { n: '03', title: 'Filtra por liquidez', desc: 'Calcula o volume médio diário em R$ usando os dados históricos de volume. Remove ativos abaixo do mínimo configurado (R$ 5M/dia para ações, R$ 500k para FIIs, etc.).' },
            { n: '04', title: 'Aplica caps por tipo', desc: 'Mantém apenas os top 200 ações, top 100 FIIs, top 30 ETFs e top 50 BDRs mais líquidos. Isso reduz os pares a testar de milhões para alguns milhares.' },
            { n: '05', title: 'Pré-filtra por correlação', desc: 'Para cada par do mesmo tipo (ação com ação, FII com FII etc.), calcula a correlação de Pearson. Descarta pares com correlação abaixo de 0.80 — sem correlação forte, não há cointegração possível.' },
            { n: '06', title: 'Roda a regressão OLS', desc: 'Para cada par que passou no filtro, usa Mínimos Quadrados Ordinários (OLS) para encontrar o Hedge Ratio β que melhor equilibra os dois ativos. Calcula o spread residual.' },
            { n: '07', title: 'Executa o Teste ADF', desc: 'Roda o Augmented Dickey-Fuller no spread. Testa ambas as direções (A~B e B~A). Descarta pares com p-value acima de 0.10.' },
            { n: '08', title: 'Calcula Z-Score e Half-life', desc: 'Para os pares aprovados, computa o Z-Score atual (janela de 60 dias) e o Half-life (velocidade de reversão estimada por modelo AR(1)).' },
            { n: '09', title: 'Gera o Score e o Sinal', desc: 'Combina ADF strength (30%), Z-Score magnitude (40%) e Half-life quality (30%) num score de 0 a 100. Classifica o sinal como LONG SPREAD, SHORT SPREAD ou NEUTRAL.' },
            { n: '10', title: 'Salva e notifica', desc: 'Persiste todos os pares no banco de dados. Pares com sinal ativo e score acima do mínimo configurado são automaticamente registrados no log de operações.' },
          ].map(({ n, title, desc }) => (
            <div key={n} style={{ display: 'flex', gap: 16, background: '#1f1f1f', border: `1px solid ${border}`, borderRadius: 2, padding: '12px 16px' }}>
              <span style={{ fontSize: 11, color: gold, fontFamily: mono, minWidth: 20, paddingTop: 1 }}>{n}</span>
              <div>
                <p style={{ fontSize: 12, color: light, fontFamily: sans, fontWeight: 600, margin: '0 0 4px' }}>{title}</p>
                <p style={{ fontSize: 12, color: body, fontFamily: sans, margin: 0, lineHeight: 1.6 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 8. Glossário ── */}
      <Section title="8. Referência rápida" sub="O que significa cada número">
        <P>Aqui está o significado exato de cada indicador que aparece na plataforma, seja na tabela de pares ou no painel de detalhes.</P>

        <p style={{ fontSize: 11, letterSpacing: '0.1em', color: dim, fontFamily: sans, margin: '24px 0 12px', textTransform: 'uppercase' }}>Colunas da tabela de pares</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, border: `1px solid ${border}`, borderRadius: 2, overflow: 'hidden', marginBottom: 32 }}>
          {[
            ['SCORE', '0 a 100', 'Nota composta do par. Combina força do ADF (30%), magnitude do Z-Score (40%) e qualidade do Half-life (30%). Score acima de 70 indica oportunidade de alta qualidade.'],
            ['ADF STAT', 'negativo', 'Estatística do teste Augmented Dickey-Fuller. Quanto mais negativa, mais forte a evidência de cointegração. Valores abaixo de -3.5 são considerados fortes.'],
            ['p-VALUE', '0.0 a 1.0', 'Probabilidade de o par NÃO ser cointegrado. Abaixo de 0.05 é o padrão ouro. Abaixo de 0.01 é excelente. A plataforma aceita até 0.10.'],
            ['Z-SCORE', 'padrão', 'Desvios padrão que o spread atual está da sua média de 60 dias. Acima de +2 ou abaixo de -2 indica oportunidade de entrada.'],
            ['HALF-LIFE', 'dias', 'Tempo médio para o spread percorrer metade do caminho de volta à média. Ideal entre 5 e 30 dias. Abaixo de 5 é muito rápido; acima de 60, muito lento.'],
            ['SIGNAL', 'texto', 'Classificação atual: LONG SPREAD (Z baixo), SHORT SPREAD (Z alto) ou NEUTRAL (sem sinal).'],
            ['PRICE A', 'R$', 'Último preço de fechamento do Ativo A, buscado no Yahoo Finance durante o scan.'],
            ['PRICE B', 'R$', 'Último preço de fechamento do Ativo B.'],
          ].map(([field, type, desc]) => (
            <div key={field} style={{ display: 'grid', gridTemplateColumns: '120px 80px 1fr', gap: 0, background: card, borderBottom: `1px solid #141414`, padding: '10px 16px', alignItems: 'start' }}>
              <span style={{ fontSize: 11, color: gold, fontFamily: mono, paddingTop: 1 }}>{field}</span>
              <span style={{ fontSize: 10, color: dim, fontFamily: mono, paddingTop: 2 }}>{type}</span>
              <span style={{ fontSize: 12, color: body, fontFamily: sans, lineHeight: 1.6 }}>{desc}</span>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 11, letterSpacing: '0.1em', color: dim, fontFamily: sans, margin: '0 0 12px', textTransform: 'uppercase' }}>Painel de detalhes do par</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, border: `1px solid ${border}`, borderRadius: 2, overflow: 'hidden', marginBottom: 32 }}>
          {[
            ['Hedge Ratio β', 'O coeficiente de cobertura. Indica quanto de B você precisa para cada unidade de A na operação. Exemplo: β = 0.8 significa que para cada 1 lot de A, você posiciona 0.8 lot de B.'],
            ['ADF Statistic', 'O mesmo valor da coluna ADF STAT. Detalha a estatística calculada pelo teste no spread deste par específico.'],
            ['p-value', 'Nível de significância do teste. Quanto menor, mais confiante a plataforma está na cointegração.'],
            ['Half-life', 'Meia-vida da reversão em dias úteis. Calculada pelo modelo AR(1) nos resíduos do spread. Diz o quanto tempo esperar para o Z-Score voltar à metade do caminho.'],
            ['Score', 'Nota de 0 a 100. Combinação ponderada de três fatores: força do ADF, magnitude do Z atual e qualidade do half-life.'],
            ['Signal', 'O sinal atual. SHORT SPREAD quando Z acima do threshold configurado. LONG SPREAD quando abaixo do negativo. NEUTRAL no intervalo.'],
            ['Current Z', 'O valor exato do Z-Score no momento do scan. É o número que determina o sinal.'],
            ['Spread Mean', 'A média histórica do spread na janela de 60 dias. Normalmente próxima de zero após normalização.'],
            ['Spread Std', 'O desvio padrão do spread na janela de lookback. Usado para normalizar o Z-Score. Quanto menor, mais previsível o spread.'],
            ['Price A / Price B', 'Preços de fechamento no momento do scan. Usados como referência de entrada caso você decida operar o par.'],
          ].map(([field, desc]) => (
            <div key={field} style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 0, background: card, borderBottom: `1px solid #141414`, padding: '10px 16px', alignItems: 'start' }}>
              <span style={{ fontSize: 11, color: gold, fontFamily: mono, paddingTop: 1 }}>{field}</span>
              <span style={{ fontSize: 12, color: body, fontFamily: sans, lineHeight: 1.6 }}>{desc}</span>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 11, letterSpacing: '0.1em', color: dim, fontFamily: sans, margin: '0 0 12px', textTransform: 'uppercase' }}>Os três gráficos do par</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
          {[
            {
              title: 'SPREAD SERIES (A - β·B)',
              desc: 'Mostra o spread bruto ao longo do tempo — ou seja, o valor de Preço_A menos β vezes Preço_B para cada pregão do último ano. Quanto mais centrado e estável, melhor o par. Quando o spread se afasta muito da linha central, surge a oportunidade.',
            },
            {
              title: 'Z-SCORE (60-day rolling)',
              desc: 'O spread normalizado. A linha dourada é o Z-Score diário. As linhas tracejadas vermelha e verde marcam os thresholds de entrada configurados (padrão ±2). Pontos vermelhos acima do threshold superior indicam SHORT SPREAD; pontos verdes abaixo indicam LONG SPREAD.',
            },
            {
              title: 'NORMALIZED PRICES (base = 100)',
              desc: 'Mostra os dois preços normalizados para uma base 100 no início do período. Permite comparar visualmente o comportamento relativo dos dois ativos sem a distorção de preços em escalas diferentes. Quando as duas linhas se afastam muito, o spread está se abrindo.',
            },
          ].map(({ title, desc }) => (
            <div key={title} style={{ background: '#1f1f1f', border: `1px solid ${border}`, borderRadius: 2, padding: '14px 18px' }}>
              <p style={{ fontSize: 11, color: light, fontFamily: mono, letterSpacing: '0.08em', margin: '0 0 6px' }}>{title}</p>
              <p style={{ fontSize: 13, color: body, fontFamily: sans, margin: 0, lineHeight: 1.7 }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Exemplo real */}
        <p style={{ fontSize: 11, letterSpacing: '0.1em', color: dim, fontFamily: sans, margin: '0 0 16px', textTransform: 'uppercase' }}>Exemplo real interpretado</p>
        <div style={{ background: '#1f1f1f', border: `1px solid ${border}`, borderRadius: 2, padding: '20px' }}>
          <p style={{ fontSize: 12, color: mid, fontFamily: sans, margin: '0 0 16px' }}>Leitura de um par com os valores: Hedge Ratio β = -0.1154 | ADF Stat = -3.9989 | p-value = 0.0010 | Half-life = 6d | Score = 99 | Signal = SHORT SPREAD | Current Z = 3.7528</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <Badge label="Score" value="99" accent />
            <Badge label="ADF Stat" value="-3.9989" />
            <Badge label="p-value" value="0.0010" accent />
            <Badge label="Half-life" value="6d" />
            <Badge label="Current Z" value="3.7528" />
            <Badge label="Signal" value="SHORT SPREAD" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['Score 99', 'Praticamente perfeito. ADF forte, Z elevado e half-life curto. Raros pares chegam aqui.'],
              ['ADF -3.9989 / p 0.001', 'Evidência fortíssima de cointegração. Apenas 1 em 1000 chances de ser falso positivo.'],
              ['Half-life 6d', 'O spread tende a percorrer metade do caminho de volta em apenas 6 pregões — ótimo para operações curtas.'],
              ['Z-Score 3.75', 'O spread está 3.75 desvios padrão acima da média. Isso é extremamente raro e sugere reversão iminente.'],
              ['Sinal SHORT SPREAD', 'Ação recomendada: vender o Ativo A e comprar β unidades do Ativo B. Objetivo: Z retornar a 0.'],
            ].map(([field, interpretation]) => (
              <div key={field} style={{ display: 'flex', gap: 12, padding: '8px 12px', background: '#1f1f1f', borderRadius: 2 }}>
                <span style={{ fontSize: 11, color: gold, fontFamily: mono, minWidth: 160 }}>{field}</span>
                <span style={{ fontSize: 12, color: body, fontFamily: sans, lineHeight: 1.5 }}>{interpretation}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Rodapé */}
      <div style={{ borderTop: `1px solid ${border}`, paddingTop: 24, marginTop: 8 }}>
        <p style={{ fontSize: 12, color: dim, fontFamily: sans, lineHeight: 1.7, margin: 0 }}>
          Esta plataforma é uma ferramenta de análise quantitativa. Os sinais gerados são baseados em relações históricas e não constituem recomendação de investimento. Cointegração passada não garante cointegração futura. Sempre gerencie o risco das operações.
        </p>
      </div>
    </div>
  )
}
