// app/api/debts/route.ts
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
      status, total_amount, amount_paid, balance_due, created_at,
      order_items (
        id, quantity, unit_price, discount, subtotal,
        product_variants (sku, color, storage, products (name))
      )
    `)
    .in('status', ['DELIVERED', 'DEBT'])
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// ─── POST : création d'une dette manuelle ─────────────────────────────────────
// Body : { customer_name, customer_phone?, total_amount, amount_paid?, notes? }
export async function POST(request: Request) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json()
  const { customer_name, customer_phone, total_amount, amount_paid = 0, notes } = body

  if (!customer_name?.trim()) {
    return NextResponse.json({ error: 'Nom du client requis' }, { status: 400 })
  }
  if (!total_amount || total_amount <= 0) {
    return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
  }
  if (amount_paid < 0 || amount_paid >= total_amount) {
    return NextResponse.json(
      { error: 'Le montant payé doit être inférieur au total' },
      { status: 400 }
    )
  }

  const { data: order, error } = await admin
    .from('orders')
    .insert({
      customer_name: customer_name.trim(),
      customer_phone: customer_phone?.trim() || null,
      status: 'DEBT',
      total_amount,
      amount_paid,
      // balance_due calculé par trigger
      notes: notes?.trim() || null,
      created_by: user.id,
      updated_by: user.id,
    } as any)
    .select('id, order_number, customer_name, customer_phone, status, total_amount, amount_paid, balance_due, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePath('/debts')

  return NextResponse.json(order, { status: 201 })
}

// ─── PATCH : marquer comme payé ───────────────────────────────────────────────
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { order_id, action, amount } = await request.json()
  if (!order_id) return NextResponse.json({ error: 'order_id requis' }, { status: 400 })

  const { data: order, error: orderError } = await admin
    .from('orders')
    .select('id, order_number, total_amount, amount_paid, balance_due')
    .eq('id', order_id)
    .single()

  if (orderError || !order) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })

  // ── Avance partielle ──────────────────────────────────────────────────────
  if (action === 'partial_payment') {
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
    }
    if (amount >= (order.balance_due ?? order.total_amount)) {
      return NextResponse.json(
        { error: 'Montant ≥ au reste dû — utilisez "Marquer payé" à la place' },
        { status: 400 }
      )
    }

    const new_amount_paid = order.amount_paid + amount

    const { data: updated, error: updateError } = await admin
      .from('orders')
      .update({
        amount_paid: new_amount_paid,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', order_id)
      .select('id, order_number, customer_name, customer_phone, status, total_amount, amount_paid, balance_due, created_at')
      .single()

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    revalidatePath('/debts')
    return NextResponse.json({ updated })
  }

  // ── Paiement total ────────────────────────────────────────────────────────
  const { error: updateError } = await admin
    .from('orders')
    .update({
      status: 'PAID',
      amount_paid: order.total_amount,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    } as any)
    .eq('id', order_id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  const { data: receipt, error: receiptError } = await admin
    .from('receipts')
    .insert({
      order_id,
      stamp_type: 'PAID',
      stamp_applied_by: user.id,
      stamp_applied_at: new Date().toISOString(),
      generated_by: user.id,
      generated_at: new Date().toISOString(),
    } as any)
    .select('id, receipt_number')
    .single()

  if (receiptError) return NextResponse.json({ error: receiptError.message }, { status: 500 })

  const { data: fullOrder } = await admin
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

  const { data: profile } = await admin
    .from('profiles').select('full_name').eq('id', user.id).single()

  const { data: shop } = await admin
    .from('shop_settings').select('name, phone, email, address').single()

  revalidatePath('/debts')
  revalidatePath('/orders')
  revalidatePath('/receipts')
  revalidatePath('/dashboard')

  return NextResponse.json({
    receipt_number: receipt.receipt_number,
    stamp_type: 'PAID',
    order: fullOrder,
    seller_name: profile?.full_name ?? null,
    shop: shop ?? { name: '', phone: null, email: null, address: null },
  })
}