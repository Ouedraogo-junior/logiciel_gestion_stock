import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReceiptsClient from './receipts-client'

export default async function ReceiptsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
    const { data: receipts } = await admin
    .from('receipts')
    .select(`
        id, receipt_number, stamp_type, generated_at, generated_by,
        orders (
        id, order_number, customer_name,
        status, total_amount, amount_paid, balance_due
        )
    `)
    .order('generated_at', { ascending: false })

    // Récupérer les noms des vendeurs séparément
    const sellerIds = [...new Set((receipts ?? []).map(r => r.generated_by).filter(Boolean))]
    const { data: profiles } = await admin
    .from('profiles')
    .select('id, full_name')
    .in('id', sellerIds)

    const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.full_name]))

    const receiptsWithSeller = (receipts ?? []).map(r => ({
    ...r,
    seller_name: profileMap[r.generated_by] ?? null,
    }))

    return <ReceiptsClient initialReceipts={receiptsWithSeller} />
}