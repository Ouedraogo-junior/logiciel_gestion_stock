import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StockClient from './stock-client'

export default async function StockPage() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Variantes actives pour le formulaire
  const { data: variants } = await admin
    .from('product_variants')
    .select(`id, sku, color, storage, condition, stock_qty, alert_threshold, created_by, products (name, brand)`)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  // Derniers mouvements
  const { data: movements } = await admin
    .from('stock_movements')
    .select(`
      id, type, quantity, reason, note, created_at, created_by,
      product_variants (id, sku, color, storage, stock_qty, products (name, brand))
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  // Profils des auteurs des mouvements
  const creatorIds = [...new Set(movements?.map(m => m.created_by).filter(Boolean))]
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, full_name')
    .in('id', creatorIds)

  const profileMap = Object.fromEntries(profiles?.map(p => [p.id, p.full_name]) ?? [])

  const movementsWithCreator = movements?.map(m => ({
    ...m,
    creator: { full_name: profileMap[m.created_by] ?? '—' }
  }))

  return <StockClient variants={variants ?? []} movements={movementsWithCreator ?? []} />
}