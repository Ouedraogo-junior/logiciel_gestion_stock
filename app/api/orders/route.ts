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
    .from('orders')
    .select(`
      id, order_number, customer_name, customer_phone,
      status, total_amount, amount_paid, balance_due,
      created_at, updated_at
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { customer_name, customer_phone, status, amount_paid, notes, items } = await request.json()

  if (!customer_name || !items?.length)
    return NextResponse.json({ error: 'Client et articles requis' }, { status: 400 })

  // Vérifier stock
  for (const item of items) {
    const { data: variant } = await admin
      .from('product_variants')
      .select('stock_qty')
      .eq('id', item.variant_id)
      .single()

    if (!variant) return NextResponse.json({ error: 'Variante introuvable' }, { status: 400 })
    if (variant.stock_qty < item.quantity)
      return NextResponse.json({ error: 'Stock insuffisant pour un article' }, { status: 400 })
  }

  const total_amount = items.reduce((sum: number, item: {
    quantity: number, unit_price: number, discount: number
  }) => sum + (item.quantity * item.unit_price - (item.discount || 0)), 0)

  // Créer la commande
  const { data: order, error: orderError } = await admin
    .from('orders')
    .insert({
      customer_name,
      customer_phone: customer_phone || null,
      status,
      total_amount,
      amount_paid: parseFloat(amount_paid) || 0,
      notes: notes || null,
      created_by: user.id,
      updated_by: user.id,
    } as any)
    .select('id, order_number')
    .single()

  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 })

  // Créer les items
  const orderItems = items.map((item: {
    variant_id: string, quantity: number, unit_price: number, discount: number
  }) => ({
    order_id: order.id,
    variant_id: item.variant_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    discount: item.discount || 0,
  }))

  const { error: itemsError } = await admin.from('order_items').insert(orderItems)
  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })

  // Déterminer le cachet selon le statut
  const stamp_type = status === 'PAID' ? 'PAID' : status === 'DELIVERED' ? 'DELIVERED' : 'NONE'

  // Générer le reçu
  const { data: receipt, error: receiptError } = await admin
    .from('receipts')
    .insert({
      order_id: order.id,
      stamp_type,
      stamp_applied_by: user.id,
      stamp_applied_at: new Date().toISOString(),
      generated_by: user.id,
      generated_at: new Date().toISOString(),
    } as any)
    .select('id, receipt_number')
    .single()

  if (receiptError) return NextResponse.json({ error: receiptError.message }, { status: 500 })

  // Récupérer les données complètes pour le PDF
  const { data: fullOrder, error: fullOrderError } = await admin
    .from('orders')
    .select(`
      id, order_number, customer_name, customer_phone,
      status, total_amount, amount_paid, balance_due, created_at,
      order_items (
        id, quantity, unit_price, discount, subtotal,
        product_variants (sku, color, storage, products (name))
      )
    `)
    .eq('id', order.id)
    .single()

  if (fullOrderError) return NextResponse.json({ error: fullOrderError.message }, { status: 500 })

  // Récupérer le nom du vendeur
  const { data: profile } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  // Récupérer les infos boutique
  const { data: shop } = await admin
    .from('shop_settings')
    .select('name, phone, email, address, logo_url')
    .single()

  revalidatePath('/orders')
  revalidatePath('/stock') 
  revalidatePath('/dashboard')

  return NextResponse.json({
    id: order.id,
    receipt_number: receipt.receipt_number,
    stamp_type,
    order: fullOrder,
    seller_name: profile?.full_name ?? null,
    shop: shop ?? { name: '', phone: null, email: null, address: null, logo_url: null },
  }, { status: 201 })
}