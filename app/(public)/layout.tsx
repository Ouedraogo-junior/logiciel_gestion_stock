import { createClient } from '@/lib/supabase/server'
import PublicNav from './_components/public-nav'
import PublicFooter from './_components/public-footer'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: shop } = await supabase
    .from('shop_settings')
    .select('name, logo_url, phone, email, address')
    .single()

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <PublicNav shop={shop} />
      <main className="flex-1">{children}</main>
      <PublicFooter shop={shop} />
    </div>
  )
}