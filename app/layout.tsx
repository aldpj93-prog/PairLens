import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PairLens — Statistical Arbitrage Scanner',
  description: 'Cointegration-based pair trading scanner for B3 equities',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
