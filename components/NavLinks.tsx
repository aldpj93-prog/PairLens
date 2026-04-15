'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/dashboard/education',   label: 'EDUCACIONAL' },
  { href: '/dashboard',             label: 'SCANNER' },
  { href: '/dashboard/operations',  label: 'OPERATIONS' },
  { href: '/dashboard/performance', label: 'PERFORMANCE' },
  { href: '/dashboard/settings',    label: 'SETTINGS' },
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
              color: active ? '#e2e2e2' : '#7a7a7a',
              fontSize: 11,
              letterSpacing: '0.1em',
              fontFamily: 'system-ui',
              textDecoration: 'none',
              borderLeft: active ? '2px solid #c8a96e' : '2px solid transparent',
              background: active ? 'rgba(200,169,110,0.04)' : 'none',
            }}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
