import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data, error } = await admin
    .from('products')
    .select(`
      id, name, brand, category, description, is_public, is_archived, created_at,
      product_variants (id, sku, storage, color, condition, buy_price, sell_price, stock_qty, alert_threshold, is_archived, created_at)
    `)
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json()

  // Mise à jour produit
  if (body.type === 'product') {
    const { error } = await admin
      .from('products')
      .update({
        name: body.name,
        brand: body.brand || null,
        category: body.category || null,
        description: body.description || null,
        is_public: body.is_public,
      })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    revalidatePath('/products')
  }

  // Archivage produit
  if (body.type === 'archive_product') {
    const { error } = await admin
      .from('products')
      .update({ is_archived: body.is_archived })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    revalidatePath('/products')
  }

  // Mise à jour variante
  if (body.type === 'variant') {
    const { error } = await admin
      .from('product_variants')
      .update({
        storage: body.storage || null,
        color: body.color || null,
        condition: body.condition,
        buy_price: parseFloat(body.buy_price),
        sell_price: parseFloat(body.sell_price),
        alert_threshold: parseInt(body.alert_threshold) || 2,
      })
      .eq('id', body.variant_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    revalidatePath('/products')
  }

  // Archivage variante
  if (body.type === 'archive_variant') {
    const { error } = await admin
      .from('product_variants')
      .update({ is_archived: body.is_archived })
      .eq('id', body.variant_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    revalidatePath('/products')
  }

  // Ajout variante
  if (body.type === 'add_variant') {
    const { data: variant, error: variantError } = await admin
      .from('product_variants')
      .insert({
        product_id: id,
        storage: body.storage || null,
        color: body.color || null,
        condition: body.condition,
        buy_price: parseFloat(body.buy_price),
        sell_price: parseFloat(body.sell_price),
        alert_threshold: parseInt(body.alert_threshold) || 2,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (variantError) return NextResponse.json({ error: variantError.message }, { status: 500 })

    // Stock initial si fourni
    const stockInitial = parseInt(body.stock_initial) || 0
    if (stockInitial > 0) {
      await admin.from('stock_movements').insert({
        variant_id: variant.id,
        type: 'IN',
        quantity: stockInitial,
        reason: 'Achat',
        note: 'Stock initial à l\'ajout de la variante',
        created_by: user.id,
      })
    }
      revalidatePath('/products')
  }

  return NextResponse.json({ success: true })
}