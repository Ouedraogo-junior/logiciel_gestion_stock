import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import ShopSettingsClient from './shop-settings-client'

export default async function ShopSettingsPage() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawProfile } = await admin
  .from('profiles').select('role').eq('id', user.id).single()

  const profile = rawProfile as { role: string } | null

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: shop } = await admin
    .from('shop_settings')
    .select('name, phone, email, address, description, logo_url')
    .single()

  return <ShopSettingsClient initialShop={shop ?? { name: '', phone: null, email: null, address: null, description: null, logo_url: null }} />
}