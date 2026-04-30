import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { unstable_cache } from 'next/cache'
import { redirect } from 'next/navigation'
import ProductsClient from './products-client'

// ✅ Requête fusionnée + mise en cache 60 secondes
const getProducts = unstable_cache(
  async () => {
    const admin = createAdminClient()

    const { data: rawProducts, error } = await admin
      .from('products')
      .select(`
        id, name, brand, category, is_public, is_archived, created_at, created_by,
        product_variants (id, sku, stock_qty, sell_price, condition, color, storage, is_archived)
      `)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })

      //  console.log('Products count:', rawProducts?.length)  // ← ajoute ça
      // console.log('Error:', error)   

    return rawProducts ?? []
  },
  ['products-list'],          // clé de cache unique
  {
    revalidate: 60,           // revalide toutes les 60 secondes
    tags: ['products'],       // tag pour invalidation manuelle
  }
)

export default async function ProductsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const products = await getProducts()

  return <ProductsClient initialProducts={products as any} />
}