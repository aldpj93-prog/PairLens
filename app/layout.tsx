import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PairLens — Scanner de Arbitragem Estatística',
  description: 'Scanner de pair trading baseado em cointegração para ações da B3',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
