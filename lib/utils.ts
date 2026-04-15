/**
 * PairLens — Formatting utilities
 */

const BRT = 'America/Sao_Paulo'

/** Format a number to exactly 4 decimal places. */
export function fmt4(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return '—'
  return n.toFixed(4)
}

/** Format a number to exactly 2 decimal places. */
export function fmt2(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return '—'
  return n.toFixed(2)
}

/** Format a percentage with 2 decimal places. */
export function fmtPct(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return '—'
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`
}

/** Format p-value — 4dp with leading zero. */
export function fmtP(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return '—'
  return n.toFixed(4)
}

/** Format a price (2dp). */
export function fmtPrice(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return '—'
  return n.toFixed(2)
}

/** Format half-life — integer days or "Inf". */
export function fmtHL(n: number | null | undefined): string {
  if (n == null || !isFinite(n as number)) return 'Inf'
  return `${Math.round(n as number)}d`
}

/** Format a score integer. */
export function fmtScore(n: number | null | undefined): string {
  if (n == null) return '—'
  return String(n)
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
export function fmtDays(n: number | null | undefined): string {
  if (n == null || !isFinite(n as number)) return '—'
  return `${(n as number).toFixed(1)}d`
}

/** Signal display text. */
export function signalLabel(signal: string | null): string {
  if (!signal) return 'NEUTRAL'
  switch (signal) {
    case 'long_spread':  return 'LONG SPREAD'
    case 'short_spread': return 'SHORT SPREAD'
    default:             return 'NEUTRAL'
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
export function fmtHedge(beta: number | null | undefined): string {
  if (beta == null || !isFinite(beta) || beta <= 0) return '—'
  if (Math.abs(beta - 1) < 0.005) return '1 : 1'
  if (beta < 1) return `${(1 / beta).toFixed(2)} : 1`
  return `1 : ${beta.toFixed(2)}`
}
