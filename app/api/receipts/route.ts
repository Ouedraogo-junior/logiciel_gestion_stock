// app/api/receipts/route.ts
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
    .from('receipts')
    .select(`
      id, receipt_number, stamp_type, generated_at,
      orders (
        id, order_number, customer_name, customer_phone,
        status, total_amount, amount_paid, balance_due, created_at,
        order_items (
          id, quantity, unit_price, discount, subtotal,
          product_variants (sku, color, storage, products (name))
        )
      ),
      profiles:generated_by (full_name)
    `)
    .order('generated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { order_id, stamp_type } = await request.json()
  if (!order_id) return NextResponse.json({ error: 'order_id requis' }, { status: 400 })

  const { data: receipt, error } = await admin
    .from('receipts')
    .insert({
      order_id,
      stamp_type: stamp_type ?? 'NONE',
      stamp_applied_by: stamp_type !== 'NONE' ? user.id : null,
      stamp_applied_at: stamp_type !== 'NONE' ? new Date().toISOString() : null,
      generated_by: user.id,
    } as any)
    .select('id, receipt_number')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: order } = await admin
    .from('orders')
    .select(`
      id, order_number, customer_name, customer_phone,
      status, total_amount, amount_paid, balance_due, created_at,
      order_items (
        id, quantity, unit_price, discount, subtotal,
        product_variants (sku, color, storage, products (name))
      )
    `)
    .eq('id', order_id)
    .single()

  const { data: shop } = await admin
    .from('shop_settings')
    .select('name, phone, email, address, logo_url')
    .single()

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  revalidatePath('/receipts')

  return NextResponse.json({
    receipt_number: receipt.receipt_number,
    stamp_type: stamp_type ?? 'NONE',
    order,
    shop,
    seller_name: profile?.full_name ?? null,
  }, { status: 201 })
}

// ─── PATCH : retour de marchandise ────────────────────────────────────────────
// Body : { order_id, receipt_id, items: [{ variant_id, quantity }] }
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { order_id, receipt_id, items } = await request.json()

  if (!order_id) return NextResponse.json({ error: 'order_id requis' }, { status: 400 })
  if (!receipt_id) return NextResponse.json({ error: 'receipt_id requis' }, { status: 400 })
  if (!items?.length) return NextResponse.json({ error: 'Aucun article à retourner' }, { status: 400 })

  const movements = items
    .filter((i: { variant_id: string; quantity: number }) => i.quantity > 0)
    .map((i: { variant_id: string; quantity: number }) => ({
      variant_id: i.variant_id,
      type: 'IN' as const,
      quantity: i.quantity,
      reason: 'Retour',
      reference_id: receipt_id,
      created_by: user.id,
    }))

  if (!movements.length) return NextResponse.json({ error: 'Quantités invalides' }, { status: 400 })

  // ── 1. Vérifier les quantités déjà retournées par variant ────────────────
  const variantIds = movements.map((m: any) => m.variant_id)

  const { data: existingReturns } = await admin
    .from('stock_movements')
    .select('variant_id, quantity')
    .eq('reference_id', receipt_id)
    .eq('reason', 'Retour')
    .in('variant_id', variantIds)

  const alreadyReturnedMap = (existingReturns ?? []).reduce((acc: Record<string, number>, m: any) => {
    acc[m.variant_id] = (acc[m.variant_id] ?? 0) + m.quantity
    return acc
  }, {})

  const { data: orderItems } = await admin
    .from('order_items')
    .select('variant_id, quantity, subtotal')
    .eq('order_id', order_id)

  const orderItemMap = (orderItems ?? []).reduce((acc: Record<string, { quantity: number; subtotal: number }>, i: any) => {
    acc[i.variant_id] = { quantity: i.quantity, subtotal: i.subtotal }
    return acc
  }, {})

  // Filtrer uniquement les mouvements encore retournables
  const validMovements = movements.filter((m: any) => {
    const alreadyReturned = alreadyReturnedMap[m.variant_id] ?? 0
    const maxQty = orderItemMap[m.variant_id]?.quantity ?? 0
    const remaining = maxQty - alreadyReturned
    return m.quantity > 0 && m.quantity <= remaining
  })

  if (!validMovements.length) return NextResponse.json({ error: 'Ces articles ont déjà été totalement retournés' }, { status: 400 })

  // ── 2. Calculer le montant à rembourser ───────────────────────────────────
  let refund_amount = 0
  for (const m of validMovements) {
    const orderItem = orderItemMap[m.variant_id]
    if (!orderItem) continue
    const unit_net = orderItem.subtotal / orderItem.quantity
    refund_amount += unit_net * m.quantity
  }

  // ── 3. Récupérer la commande ──────────────────────────────────────────────
  const { data: order, error: orderError } = await admin
    .from('orders')
    .select('total_amount, amount_paid, balance_due')
    .eq('id', order_id)
    .single()

  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 })

  // ── 4. Calculer les nouveaux montants ─────────────────────────────────────
  const new_total = order.total_amount - refund_amount
  const new_balance = Math.max(0, order.balance_due - refund_amount)
  const absorbed_by_debt = order.balance_due - new_balance
  const cash_refund = refund_amount - absorbed_by_debt
  const new_amount_paid = Math.max(0, order.amount_paid - cash_refund)

  // ── 5. Mettre à jour la commande ──────────────────────────────────────────
  const { error: updateError } = await admin
    .from('orders')
    .update({
      total_amount: new_total,
      amount_paid: new_amount_paid,
    } as any)
    .eq('id', order_id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // ── 6. Insérer les mouvements de stock valides ────────────────────────────
  const { error: stockError } = await admin.from('stock_movements').insert(validMovements)
  if (stockError) return NextResponse.json({ error: stockError.message }, { status: 500 })

  revalidatePath('/receipts', 'page')
  revalidatePath('/stock', 'page')
  revalidatePath('/orders', 'page')
  revalidatePath('/dashboard', 'page')

  return NextResponse.json({ success: true, refund_amount })
}