import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import StatsClient from './stats-client'

export default async function StatsPage() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawProfile } = await admin
  .from('profiles').select('role').eq('id', user.id).single()

  const profile = rawProfile as { role: string } | null

  if (profile?.role !== 'admin') redirect('/dashboard')

  return <StatsClient />
}