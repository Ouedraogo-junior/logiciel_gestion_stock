import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HistoryClient from './history-client'

export default async function StockHistoryPage() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: movements } = await admin
    .from('stock_movements')
    .select(`
      id, type, quantity, reason, note, created_at,
      product_variants (id, sku, color, storage, condition, stock_qty, products (name, brand))
    `)
    .order('created_at', { ascending: false })

  return <HistoryClient movements={movements ?? []} />
}