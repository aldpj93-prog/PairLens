import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createSSRClient } from '@/lib/supabase'
import ScanRunStatus from '@/components/ScanRunStatus'
import LogoutButton from '@/components/LogoutButton'
import NavLinks from '@/components/NavLinks'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  //const cookieStore = cookies()
  //const supabase = createSSRClient(cookieStore)
  //const { data: { user } } = await supabase.auth.getUser()
  //if (!user) redirect('/login')

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#1a1a1a' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 220,
          minWidth: 220,
          background: '#222222',
          borderRight: '1px solid #3d3d3d',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 0 16px',
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          overflowY: 'auto',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '0 20px 24px' }}>
          <p
            style={{
              color: '#d4b87a',
              fontSize: 13,
              letterSpacing: '0.2em',
              fontFamily: '"JetBrains Mono", monospace',
              fontWeight: 600,
              margin: 0,
            }}
          >
            PAIR<span style={{ color: '#f5f5f5' }}>LENS</span>
          </p>
          <p style={{ color: '#8a8a8a', fontSize: 10, marginTop: 3, letterSpacing: '0.1em' }}>
            SCANNER DE COINTEGRAÇÃO B3
          </p>
        </div>

        {/* Navigation */}
        <div style={{ flex: 1 }}>
          <NavLinks />
        </div>

        {/* Footer: scan status + logout */}
        <div style={{ padding: '0 16px', marginTop: 16 }}>

          <div style={{ marginTop: 16 }}>
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: 220, flex: 1, padding: 32, minWidth: 0 }}>
        {children}
      </main>
    </div>
  )
}

