import { createClient } from '@/lib/supabase/server'
import CatalogueClient from './catalogue-client'

export default async function CataloguePage() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select(`
      id, name, brand, category, description,
      product_variants (id, storage, color, condition, sell_price)
    `)
    .eq('is_public', true)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  return <CatalogueClient products={products ?? []} />
}