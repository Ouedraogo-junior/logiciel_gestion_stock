import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import UsersClient from './users-client'

export default async function UsersPage() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawProfile } = await admin
    .from('profiles').select('role').eq('id', user.id).single()

  const profile = rawProfile as { role: string } | null

  if (profile?.role !== 'admin') redirect('/dashboard')

  return <UsersClient />
}