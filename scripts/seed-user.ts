/**
 * PairLens — seed admin user
 *
 * Usage: npm run seed-user
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function seedUser() {
  const email    = 'admin@pairlens.local'
  const password = '2518Jnr@'

  console.log(`Seeding user: ${email}`)

  // Try to create — if already exists, update password
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) {
    if (error.message.includes('already registered') || error.message.includes('already been registered')) {
      // User exists — list and update
      const { data: listData } = await supabase.auth.admin.listUsers()
      const existing = listData?.users?.find(u => u.email === email)
      if (existing) {
        const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
          password,
          email_confirm: true,
        })
        if (updateError) {
          console.error('Failed to update user:', updateError.message)
          process.exit(1)
        }
        console.log(`User updated: ${email} (id: ${existing.id})`)
      }
    } else {
      console.error('Failed to create user:', error.message)
      process.exit(1)
    }
  } else {
    console.log(`User created: ${email} (id: ${data.user?.id})`)
  }

  console.log('Done.')
}

seedUser().catch(err => {
  console.error(err)
  process.exit(1)
})
