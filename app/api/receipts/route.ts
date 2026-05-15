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

  const { error } = await admin.from('stock_movements').insert(movements)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePath('/stock')
  revalidatePath('/receipts')
  revalidatePath('/orders') 

  return NextResponse.json({ success: true })
}