// app/(back-office)/orders/page.tsx
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { unstable_cache } from 'next/cache'
import { redirect } from 'next/navigation'
import OrdersClient from './orders-client'

const getOrders = unstable_cache(
  async () => {
    const admin = createAdminClient()

    const [{ data: rawOrders }, { data: rawMovements }, { data: rawProfiles }] = await Promise.all([
      admin
        .from('orders')
        .select('id, order_number, customer_name, customer_phone, status, total_amount, amount_paid, balance_due, created_at, created_by')
        .order('created_at', { ascending: false }),
      admin
        .from('stock_movements')
        .select('reference_id, quantity')
        .eq('reason', 'Retour'),
      admin.from('profiles').select('id, full_name'),
    ])

    const orders = rawOrders ?? []

    // Somme des retours par receipt_id
    const returnMap: Record<string, number> = {}
    for (const m of rawMovements ?? []) {
      if (!m.reference_id) continue
      returnMap[m.reference_id] = (returnMap[m.reference_id] ?? 0) + m.quantity
    }

    // receipts pour relier receipt_id → order_id
    const { data: rawReceipts } = await admin
      .from('receipts')
      .select('id, order_id')

    const orderReturnMap: Record<string, number> = {}
    for (const r of rawReceipts ?? []) {
      orderReturnMap[r.order_id] = (orderReturnMap[r.order_id] ?? 0) + (returnMap[r.id] ?? 0)
    }

    const profileMap = Object.fromEntries(
      (rawProfiles ?? []).map((p: any) => [p.id, p.full_name])
    )

    return orders.map((o: any) => ({
      ...o,
      returned_qty: orderReturnMap[o.id] ?? 0,
      creator: { full_name: profileMap[o.created_by ?? ''] ?? '—' }
    }))
  },
  ['orders-list'],
  { revalidate: 30 }
)

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const orders = await getOrders()

  return <OrdersClient initialOrders={orders as any} />
}