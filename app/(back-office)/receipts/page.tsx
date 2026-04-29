import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReceiptsClient from './receipts-client'

export default async function ReceiptsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: rawReceipts } = await admin
    .from('receipts')
    .select(`
      id, receipt_number, stamp_type, generated_at, generated_by,
      orders (
        id, order_number, customer_name,
        status, total_amount, amount_paid, balance_due
      )
    `)
    .order('generated_at', { ascending: false })

  const receipts = rawReceipts as Array<{
    id: string
    receipt_number: string
    stamp_type: 'PAID' | 'DELIVERED' | 'NONE'
    generated_at: string
    generated_by: string | null
    orders: {
      id: string
      order_number: string
      customer_name: string
      status: string
      total_amount: number
      amount_paid: number
      balance_due: number
    } | null
  }> | null

  const sellerIds = [...new Set((receipts ?? []).map(r => r.generated_by).filter(Boolean))]

  const { data: rawProfiles } = await admin
    .from('profiles')
    .select('id, full_name')
    .in('id', sellerIds as string[])

  const profiles = rawProfiles as Array<{ id: string; full_name: string }> | null

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.full_name]))

  const receiptsWithSeller = (receipts ?? []).map(r => ({
    ...r,
    seller_name: profileMap[r.generated_by ?? ''] ?? null,
  }))

  return <ReceiptsClient initialReceipts={receiptsWithSeller} />
}