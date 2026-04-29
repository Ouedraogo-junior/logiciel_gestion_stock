import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import ProductsClient from './products-client'

export default async function ProductsPage() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: products } = await admin
  .from('products')
  .select(`
    id, name, brand, category, is_public, is_archived, created_at, created_by,
    product_variants (id, sku, stock_qty, sell_price, condition, color, storage, is_archived)
  `)
  .eq('is_archived', false)
  .order('created_at', { ascending: false })

// Récupérer les noms des créateurs
const creatorIds = [...new Set(products?.map(p => p.created_by).filter(Boolean))]
const { data: profiles } = await admin
  .from('profiles')
  .select('id, full_name')
  .in('id', creatorIds)

const profileMap = Object.fromEntries(profiles?.map(p => [p.id, p.full_name]) ?? [])

const productsWithCreator = products?.map(p => ({
  ...p,
  creator: { full_name: profileMap[p.created_by] ?? '—' }
}))

  return <ProductsClient initialProducts={productsWithCreator ?? []} />
}