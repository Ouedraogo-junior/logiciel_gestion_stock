import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OrderDetailClient from './order-detail-client'

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: order } = await admin
    .from('orders')
    .select(`
      id, order_number, customer_name, customer_phone,
      status, total_amount, amount_paid, balance_due, notes,
      created_at, updated_at,
      order_items (id, quantity, unit_price, discount, subtotal,
        product_variants (sku, color, storage, condition, products (name, brand))
      )
    `)
    .eq('id', id)
    .single()

  if (!order) redirect('/orders')

  return <OrderDetailClient order={order} />
}