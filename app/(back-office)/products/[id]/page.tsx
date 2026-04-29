import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProductDetailClient from './product-detail-client'

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: product } = await admin
    .from('products')
    .select(`
      id, name, brand, category, description, is_public, is_archived, created_at,
      product_variants (id, sku, storage, color, condition, buy_price, sell_price, stock_qty, alert_threshold, is_archived, created_at)
    `)
    .eq('id', id)
    .single()

  if (!product) redirect('/products')

  return <ProductDetailClient product={product} />
}