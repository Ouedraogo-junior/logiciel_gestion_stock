import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StockClient from './stock-client'

export default async function StockPage() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawVariants } = await admin
    .from('product_variants')
    .select(`id, sku, color, storage, condition, stock_qty, alert_threshold, created_by, products (name, brand)`)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  const variants = rawVariants as Array<{
    id: string
    sku: string
    color: string | null
    storage: string | null
    condition: string
    stock_qty: number
    alert_threshold: number | null
    created_by: string | null
    products: { name: string; brand: string | null } | null
  }> | null

  const { data: rawMovements } = await admin
    .from('stock_movements')
    .select(`
      id, type, quantity, reason, note, created_at, created_by,
      product_variants (id, sku, color, storage, stock_qty, products (name, brand))
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  const movements = rawMovements as Array<{
    id: string
    type: 'IN' | 'OUT' 
    quantity: number
    reason: string | null
    note: string | null
    created_at: string
    created_by: string | null
    product_variants: {
      id: string
      sku: string
      color: string | null
      storage: string | null
      stock_qty: number
      products: { name: string; brand: string | null } | null
    } | null
  }> | null

  const creatorIds = [...new Set((movements ?? []).map(m => m.created_by).filter(Boolean))]

  const { data: rawProfiles } = await admin
    .from('profiles')
    .select('id, full_name')
    .in('id', creatorIds as string[])

  const profiles = rawProfiles as Array<{ id: string; full_name: string }> | null

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.full_name]))

  const movementsWithCreator = (movements ?? []).map(m => ({
    ...m,
    creator: { full_name: profileMap[m.created_by ?? ''] ?? '—' }
  }))

  return <StockClient variants={variants ?? []} movements={movementsWithCreator ?? []} />
}