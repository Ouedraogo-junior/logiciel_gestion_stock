import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { unstable_cache } from 'next/cache'
import { redirect } from 'next/navigation'
import OrdersClient from './orders-client'

const getOrders = unstable_cache(
  async () => {
    const admin = createAdminClient()

    const { data: rawOrders } = await admin
      .from('orders')
      .select(`
        id, order_number, customer_name, customer_phone,
        status, total_amount, amount_paid, balance_due, created_at, created_by
      `)
      .order('created_at', { ascending: false })

    const orders = rawOrders ?? []

    const creatorIds = [...new Set(orders.map((o: any) => o.created_by).filter(Boolean))]

    const { data: rawProfiles } = await admin
      .from('profiles')
      .select('id, full_name')
      .in('id', creatorIds as string[])

    const profileMap = Object.fromEntries(
      (rawProfiles ?? []).map((p: any) => [p.id, p.full_name])
    )

    return orders.map((o: any) => ({
      ...o,
      creator: { full_name: profileMap[o.created_by ?? ''] ?? '—' }
    }))
  },
  ['orders-list'],
  {
    revalidate: 30,
  }
)

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const orders = await getOrders()

  return <OrdersClient initialOrders={orders as any} />
}