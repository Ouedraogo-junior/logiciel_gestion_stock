import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { unstable_cache } from 'next/cache'
import { redirect } from 'next/navigation'
import DebtsClient from './debts-client'

const getDebts = unstable_cache(
  async () => {
    const admin = createAdminClient()

    const { data } = await admin
      .from('orders')
      .select(`
        id, order_number, customer_name, customer_phone,
        status, total_amount, amount_paid, balance_due, created_at
      `)
      .in('status', ['DELIVERED', 'DEBT'])
      .order('created_at', { ascending: false })

    return data ?? []
  },
  ['debts-list'],
  { revalidate: 30 }
)

export default async function DebtsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const debts = await getDebts()

  return <DebtsClient initialDebts={debts as any} />
}