import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import SidebarClient from '@/components/sidebar-client'

export default async function BackOfficeLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await admin
    .from('profiles').select('full_name, role, username').eq('id', user.id).single()

  return (
  <div className="flex h-screen bg-gray-100 overflow-hidden">
    <SidebarClient profile={profile} />
    <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
      {children}
    </main>
  </div>
)
}