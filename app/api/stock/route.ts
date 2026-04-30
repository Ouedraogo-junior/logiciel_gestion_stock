import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function GET() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data, error } = await admin
    .from('stock_movements')
    .select(`
      id, type, quantity, reason, note, created_at,
      product_variants (id, sku, color, storage, condition, stock_qty,
        products (name, brand)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { variant_id, type, quantity, reason, note } = await request.json()

  if (!variant_id || !type || !quantity || !reason)
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })

  if (!['IN', 'OUT'].includes(type))
    return NextResponse.json({ error: 'Type invalide' }, { status: 400 })

  // Vérifier stock suffisant pour une sortie
  if (type === 'OUT') {
    const { data: variant } = await admin
      .from('product_variants')
      .select('stock_qty')
      .eq('id', variant_id)
      .single()

    if (!variant || variant.stock_qty < quantity)
      return NextResponse.json({ error: 'Stock insuffisant' }, { status: 400 })
  }

  const { error } = await admin
    .from('stock_movements')
    .insert({ variant_id, type, quantity: parseInt(quantity), reason, note: note || null, created_by: user.id })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePath('/stock')  // revalide la page de stock pour rafraîchir les données
  revalidatePath('/products')
  revalidatePath('/dashboard')
  return NextResponse.json({ success: true }, { status: 201 })
}