import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { unstable_cache } from 'next/cache'
import { redirect } from 'next/navigation'
import DashboardClient from './dashboard-client'

const getDashboardData = unstable_cache(
  async () => {
    const admin = createAdminClient()

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    const { data: todayOrders } = await admin
      .from('orders')
      .select('amount_paid')
      .eq('status', 'PAID')
      .gte('created_at', todayISO)
      .returns<{ amount_paid: number }[]>()

    const caToday = (todayOrders ?? []).reduce((s, o) => s + o.amount_paid, 0)

    const { data: debts } = await admin
      .from('orders')
      .select('balance_due')
      .in('status', ['DELIVERED', 'DEBT'])
      .returns<{ balance_due: number }[]>()

    const totalDettes = (debts ?? []).reduce((s, o) => s + o.balance_due, 0)

    const { data: lowStock } = await admin
      .from('product_variants')
      .select('sku, color, storage, condition, stock_qty, alert_threshold, products(name)')
      .filter('stock_qty', 'lte', 'alert_threshold')
      .eq('is_archived', false)
      .order('stock_qty', { ascending: true })
      .limit(10)

    const { data: orderItems } = await admin
      .from('order_items')
      .select('quantity, product_variants (products (name))')
      .returns<{ quantity: number; product_variants: { products: { name: string } | null } | null }[]>()

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

    return { caToday, totalDettes, lowStock: lowStock ?? [], top5 }
  },
  ['dashboard-data'],
  { revalidate: 60 }
)

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const data = await getDashboardData()

  return <DashboardClient initialData={data} />
}