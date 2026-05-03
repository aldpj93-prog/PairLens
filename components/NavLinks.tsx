'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/dashboard/education',   label: 'EDUCACIONAL' },
  { href: '/dashboard',             label: 'SCANNER' },
  { href: '/dashboard/operations',  label: 'OPERAÇÕES' },
  { href: '/dashboard/performance', label: 'DESEMPENHO' },
  { href: '/planos',                label: 'PLANOS' },
  { href: '/dashboard/settings',    label: 'CONFIGURAÇÕES' },
]

export default function NavLinks() {
  const pathname = usePathname()

  return (
    <nav>
      {NAV_LINKS.map(link => {
        const active = pathname === link.href ||
          (link.href !== '/dashboard' && pathname.startsWith(link.href))
        return (
          <Link
            key={link.href}
            href={link.href}
            style={{
              display: 'block',
              padding: '9px 20px',
              color: active ? '#f5f5f5' : '#a0a0a0',
              fontSize: 11,
              letterSpacing: '0.1em',
              fontFamily: 'system-ui',
              textDecoration: 'none',
              borderLeft: active ? '2px solid #d4b87a' : '2px solid transparent',
              background: active ? 'rgba(212,184,122,0.08)' : 'none',
            }}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
