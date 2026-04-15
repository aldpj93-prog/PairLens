'use client'

import { createBrowserSupabaseClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        background: 'none',
        border: 'none',
        color: '#4a4a4a',
        fontSize: 10,
        letterSpacing: '0.1em',
        cursor: 'pointer',
        padding: 0,
        fontFamily: 'system-ui',
      }}
      className="hover-opacity"
    >
      SIGN OUT
    </button>
  )
}
