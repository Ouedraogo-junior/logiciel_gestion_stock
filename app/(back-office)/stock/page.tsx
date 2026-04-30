import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { unstable_cache } from 'next/cache'
import { redirect } from 'next/navigation'
import StockClient from './stock-client'

const getStockData = unstable_cache(
  async () => {
    const admin = createAdminClient()

    const { data: rawVariants } = await admin
      .from('product_variants')
      .select(`id, sku, color, storage, condition, stock_qty, alert_threshold, created_by, products (name, brand)`)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })

    const { data: rawMovements } = await admin
      .from('stock_movements')
      .select(`
        id, type, quantity, reason, note, created_at, created_by,
        product_variants (id, sku, color, storage, stock_qty, products (name, brand))
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    const movements = rawMovements ?? []

    // Récupère les créateurs
    const creatorIds = [...new Set(movements.map((m: any) => m.created_by).filter(Boolean))]
    const { data: rawProfiles } = await admin
      .from('profiles')
      .select('id, full_name')
      .in('id', creatorIds as string[])

    const profileMap = Object.fromEntries(
      (rawProfiles ?? []).map((p: any) => [p.id, p.full_name])
    )

    const movementsWithCreator = movements.map((m: any) => ({
      ...m,
      creator: { full_name: profileMap[m.created_by ?? ''] ?? '—' }
    }))

    return {
      variants: rawVariants ?? [],
      movements: movementsWithCreator,
    }
  },
  ['stock-data'],
  {
    revalidate: 30,  // 30s car le stock change plus souvent
  }
)

export default async function StockPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { variants, movements } = await getStockData()

  return <StockClient variants={variants as any} movements={movements as any} />
}