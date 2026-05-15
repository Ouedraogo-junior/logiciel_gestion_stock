import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { unstable_cache } from 'next/cache'
import { redirect } from 'next/navigation'
import ProductsClient from './products-client'

// ✅ Requête fusionnée + mise en cache 60 secondes
const getProducts = unstable_cache(
  async () => {
    const admin = createAdminClient()

    const { data: rawProducts } = await admin
      .from('products')
      .select(`
        id, name, brand, category, is_public, is_archived, created_at, created_by,
        product_variants (id, sku, stock_qty, sell_price, condition, color, storage, is_archived)
      `)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })

    const products = rawProducts ?? []

    const creatorIds = [...new Set(products.map((p: any) => p.created_by).filter(Boolean))]

    const { data: rawProfiles } = await admin
      .from('profiles')
      .select('id, full_name')
      .in('id', creatorIds as string[])

    const profileMap = Object.fromEntries(
      (rawProfiles ?? []).map((p: any) => [p.id, p.full_name])
    )

    return products.map((p: any) => ({
      ...p,
      creator: { full_name: profileMap[p.created_by ?? ''] ?? '—' }
    }))
  },
  ['products-list'],
  {
    revalidate: 60,
    tags: ['products'],
  }
)

export default async function ProductsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const products = await getProducts()

  return <ProductsClient initialProducts={products as any} />
}