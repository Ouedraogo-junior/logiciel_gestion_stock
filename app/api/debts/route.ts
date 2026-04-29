import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { order_id } = await request.json()
  if (!order_id) return NextResponse.json({ error: 'order_id requis' }, { status: 400 })

  // Récupérer la commande
  const { data: order, error: orderError } = await admin
    .from('orders')
    .select('id, order_number, total_amount')
    .eq('id', order_id)
    .single()

  if (orderError || !order) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })

  // Marquer comme payé
  const { error: updateError } = await admin
    .from('orders')
    .update({
      status: 'PAID',
      amount_paid: order.total_amount,
    //   balance_due: 0,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', order_id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // Générer un nouveau reçu PAID
  const { data: receipt, error: receiptError } = await admin
    .from('receipts')
    .insert({
      order_id,
      stamp_type: 'PAID',
      stamp_applied_by: user.id,
      stamp_applied_at: new Date().toISOString(),
      generated_by: user.id,
      generated_at: new Date().toISOString(),
    })
    .select('id, receipt_number')
    .single()

  if (receiptError) return NextResponse.json({ error: receiptError.message }, { status: 500 })

  // Données complètes pour le PDF
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
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const { data: shop } = await admin
    .from('shop_settings')
    .select('name, phone, email, address')
    .single()

  return NextResponse.json({
    receipt_number: receipt.receipt_number,
    stamp_type: 'PAID',
    order: fullOrder,
    seller_name: profile?.full_name ?? null,
    shop: shop ?? { name: '', phone: null, email: null, address: null },
  })
}