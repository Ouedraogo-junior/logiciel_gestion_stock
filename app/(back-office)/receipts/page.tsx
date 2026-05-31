import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReceiptsClient from './receipts-client'

export const dynamic = 'force-dynamic'

async function getReceipts() {
  const admin = createAdminClient()

  const { data: rawReceipts } = await admin
    .from('receipts')
    .select(`
      id, receipt_number, stamp_type, generated_at, generated_by,
      orders (
        id, order_number, customer_name,
        status, total_amount, amount_paid, balance_due,
        order_items (
          id, quantity,
          product_variants (id, sku, color, storage, products (name))
        )
      )
    `)
    .order('generated_at', { ascending: false })

  const receipts = rawReceipts ?? []

  const sellerIds = [...new Set(receipts.map((r: any) => r.generated_by).filter(Boolean))]
  const { data: rawProfiles } = await admin
    .from('profiles')
    .select('id, full_name')
    .in('id', sellerIds as string[])
  const profileMap = Object.fromEntries(
    (rawProfiles ?? []).map((p: any) => [p.id, p.full_name])
  )

  const receiptIds = receipts.map((r: any) => r.id).filter(Boolean)
    const { data: rawReturns } = await admin
    .from('stock_movements')
    .select('reference_id, variant_id, quantity')
    .eq('reason', 'Retour')
    .not('reference_id', 'is', null)

  const receiptIdSet = new Set(receiptIds)
  const filteredReturns = (rawReturns ?? []).filter((m: any) => receiptIdSet.has(m.reference_id))

  const returnMap = filteredReturns.reduce((acc: Record<string, number>, m: any) => {
    acc[m.reference_id] = (acc[m.reference_id] ?? 0) + m.quantity
    return acc
  }, {})

  const returnByVariantMap = filteredReturns.reduce((acc: Record<string, Record<string, number>>, m: any) => {
    if (!acc[m.reference_id]) acc[m.reference_id] = {}
    acc[m.reference_id][m.variant_id] = (acc[m.reference_id][m.variant_id] ?? 0) + m.quantity
    return acc
  }, {})

  return receipts.map((r: any) => ({
    ...r,
    seller_name: profileMap[r.generated_by ?? ''] ?? null,
    returned_qty: returnMap[r.id] ?? 0,
    returned_by_variant: returnByVariantMap[r.id] ?? {},
  }))
}

export default async function ReceiptsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const receipts = await getReceipts()
  return <ReceiptsClient initialReceipts={receipts as any} />
}