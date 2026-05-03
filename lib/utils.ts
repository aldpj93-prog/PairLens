/**
 * PairLens — Formatting utilities
 */

const BRT = 'America/Sao_Paulo'

function toNum(n: unknown): number | null {
  if (n == null) return null
  const v = typeof n === 'number' ? n : Number(n as any)
  return isFinite(v) ? v : null
}

/** Format a number to exactly 4 decimal places. */
export function fmt4(n: number | string | null | undefined): string {
  const v = toNum(n); if (v == null) return '—'
  return v.toFixed(4)
}

/** Format a number to exactly 2 decimal places. */
export function fmt2(n: number | string | null | undefined): string {
  const v = toNum(n); if (v == null) return '—'
  return v.toFixed(2)
}

/** Format a percentage with 2 decimal places. */
export function fmtPct(n: number | string | null | undefined): string {
  const v = toNum(n); if (v == null) return '—'
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
}

/** Format p-value — 4dp with leading zero. */
export function fmtP(n: number | string | null | undefined): string {
  const v = toNum(n); if (v == null) return '—'
  return v.toFixed(4)
}

/** Format a price (2dp). */
export function fmtPrice(n: number | string | null | undefined): string {
  const v = toNum(n); if (v == null) return '—'
  return v.toFixed(2)
}

/** Format half-life — integer days or "Inf". */
export function fmtHL(n: number | string | null | undefined): string {
  const v = toNum(n); if (v == null) return 'Inf'
  return `${Math.round(v)}d`
}

/** Format a score integer. */
export function fmtScore(n: number | string | null | undefined): string {
  const v = toNum(n); if (v == null) return '—'
  return String(v)
}

/** Format a timestamp in BRT timezone. */
export function fmtDateBRT(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    timeZone: BRT,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Format just the date in BRT. */
export function fmtDateOnlyBRT(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: BRT })
}

/** Format duration in days to 1dp. */
export function fmtDays(n: number | string | null | undefined): string {
  const v = toNum(n); if (v == null) return '—'
  return `${v.toFixed(1)}d`
}

/** Signal display text. */
export function signalLabel(signal: string | null): string {
  if (!signal) return 'NEUTRO'
  switch (signal) {
    case 'long_spread':  return 'SPREAD COMPRADO'
    case 'short_spread': return 'SPREAD VENDIDO'
    default:             return 'NEUTRO'
  }
}

/** Signal CSS color class. */
export function signalClass(signal: string | null): string {
  if (!signal) return 'text-neutral'
  switch (signal) {
    case 'long_spread':  return 'text-positive'
    case 'short_spread': return 'text-negative'
    default:             return 'text-tertiary'
  }
}

/** Returns true if a number represents a finite value worth displaying. */
export function isValidNumber(n: unknown): n is number {
  return typeof n === 'number' && isFinite(n)
}

/**
 * Formata o hedge ratio β como uma proporção legível entre ativos.
 *
 * Se β < 1 (ex: 0.30) → "3.33 A : 1 B"  (compra 3.33 de A para vender 1 de B)
 * Se β ≥ 1 (ex: 2.00) → "1 A : 2.00 B"  (compra 1 de A para vender 2 de B)
 */
export function fmtHedge(beta: number | string | null | undefined): string {
  const v = toNum(beta); if (v == null || v <= 0) return '—'
  if (Math.abs(v - 1) < 0.005) return '1 : 1'
  if (v < 1) return `${(1 / v).toFixed(2)} : 1`
  return `1 : ${v.toFixed(2)}`
}
