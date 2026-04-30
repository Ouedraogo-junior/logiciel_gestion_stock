import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

type VariantInput = {
  storage: string
  color: string
  condition: string
  buy_price: string
  sell_price: string
  alert_threshold: string
  stock_initial: string
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { name, brand, category, description, is_public, variants } = await request.json()

  if (!name || !variants?.length)
    return NextResponse.json({ error: 'Nom et au moins une variante requis' }, { status: 400 })

  // Créer le produit
  const { data: product, error: productError } = await admin
    .from('products')
    .insert({
      name,
      brand: brand || null,
      category: category || null,
      description: description || null,
      is_public,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (productError) return NextResponse.json({ error: productError.message }, { status: 500 })

  // Créer les variantes
  const variantRows = variants.map((v: VariantInput) => ({
    product_id: product.id,
    storage: v.storage || null,
    color: v.color || null,
    condition: v.condition,
    buy_price: parseFloat(v.buy_price),
    sell_price: parseFloat(v.sell_price),
    alert_threshold: parseInt(v.alert_threshold) || 2,
    created_by: user.id,
  }))

  const { data: insertedVariants, error: variantError } = await admin
    .from('product_variants')
    .insert(variantRows)
    .select('id')

  if (variantError) return NextResponse.json({ error: variantError.message }, { status: 500 })

  // Créer les mouvements de stock initiaux
  const stockMovements = insertedVariants
    .map((v, i) => ({
      variant_id: v.id,
      type: 'IN' as const,
      quantity: parseInt(variants[i].stock_initial) || 0,
      reason: 'Achat',
      note: 'Stock initial à la création du produit',
      created_by: user.id,
    }))
    .filter(m => m.quantity > 0)

  if (stockMovements.length > 0) {
    const { error: movementError } = await admin
      .from('stock_movements')
      .insert(stockMovements)
    if (movementError) return NextResponse.json({ error: movementError.message }, { status: 500 })
  }

  revalidatePath('/products')

  return NextResponse.json({ id: product.id }, { status: 201 })
}