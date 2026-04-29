import { createAdminClient } from '@/lib/supabase/admin'
import LoginClient from './login-client'

export default async function LoginPage() {
  const admin = createAdminClient()
  const { data: shop } = await admin
    .from('shop_settings')
    .select('name, logo_url')
    .single()

  return <LoginClient shop={shop} />
}