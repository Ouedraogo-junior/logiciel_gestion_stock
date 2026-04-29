import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OrdersClient from './orders-client'

export default async function OrdersPage() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: orders } = await admin
  .from('orders')
    .select(`
      id, order_number, customer_name, customer_phone,
      status, total_amount, amount_paid, balance_due, created_at, created_by
    `)
    .order('created_at', { ascending: false })

  const creatorIds = [...new Set(orders?.map(o => o.created_by).filter(Boolean))]
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, full_name')
    .in('id', creatorIds)

  const profileMap = Object.fromEntries(profiles?.map(p => [p.id, p.full_name]) ?? [])

  const ordersWithCreator = orders?.map(o => ({
    ...o,
    creator: { full_name: profileMap[o.created_by] ?? '—' }
  }))

  return <OrdersClient initialOrders={ordersWithCreator ?? []} />
}