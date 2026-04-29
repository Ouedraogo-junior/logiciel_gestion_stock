import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import AccountClient from './account-client'

export default async function AccountPage() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, username, role')
    .eq('id', user.id)
    .single()

  return <AccountClient profile={profile ?? { full_name: '', username: null, role: 'vendeur' }} />
}