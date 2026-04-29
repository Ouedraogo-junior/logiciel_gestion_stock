import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import ShopSettingsClient from './shop-settings-client'

export default async function ShopSettingsPage() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await admin
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: shop } = await admin
    .from('shop_settings')
    .select('name, phone, email, address, description')
    .single()

  return <ShopSettingsClient initialShop={shop ?? { name: '', phone: null, email: null, address: null, description: null }} />
}