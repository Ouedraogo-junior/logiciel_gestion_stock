import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = today.toISOString()

  // CA du jour (commandes PAID créées aujourd'hui)
  const { data: todayOrders } = await admin
    .from('orders')
    .select('amount_paid')
    .eq('status', 'PAID')
    .gte('created_at', todayISO)

  const caToday = (todayOrders ?? []).reduce((s, o) => s + o.amount_paid, 0)

  // Total dettes actives
  const { data: debts } = await admin
    .from('orders')
    .select('balance_due')
    .in('status', ['DELIVERED', 'DEBT'])

  const totalDettes = (debts ?? []).reduce((s, o) => s + o.balance_due, 0)

  // Alertes stock faible
  const { data: lowStock } = await admin
    .from('product_variants')
    .select('sku, color, storage, condition, stock_qty, alert_threshold, products(name)')
    .filter('stock_qty', 'lte', 'alert_threshold')
    .eq('is_archived', false)
    .order('stock_qty', { ascending: true })
    .limit(10)

  // Top 5 produits vendus
  const { data: orderItems } = await admin
    .from('order_items')
    .select(`
      quantity,
      product_variants (
        products (name)
      )
    `)

  // Agréger par produit
  const productMap: Record<string, number> = {}
  for (const item of orderItems ?? []) {
    const name = (item.product_variants as any)?.products?.name
    if (!name) continue
    productMap[name] = (productMap[name] ?? 0) + item.quantity
  }

  const top5 = Object.entries(productMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, qty]) => ({ name, qty }))

  return NextResponse.json({ caToday, totalDettes, lowStock: lowStock ?? [], top5 })
}