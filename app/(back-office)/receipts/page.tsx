import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { unstable_cache } from 'next/cache'
import { redirect } from 'next/navigation'
import ReceiptsClient from './receipts-client'

const getReceipts = unstable_cache(
  async () => {
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

    const receipts = rawReceipts ?? []

    const sellerIds = [...new Set(receipts.map((r: any) => r.generated_by).filter(Boolean))]

    const { data: rawProfiles } = await admin
      .from('profiles')
      .select('id, full_name')
      .in('id', sellerIds as string[])

    const profileMap = Object.fromEntries(
      (rawProfiles ?? []).map((p: any) => [p.id, p.full_name])
    )

    return receipts.map((r: any) => ({
      ...r,
      seller_name: profileMap[r.generated_by ?? ''] ?? null,
    }))
  },
  ['receipts-list'],
  { revalidate: 30 }
)

export default async function ReceiptsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const receipts = await getReceipts()

  return <ReceiptsClient initialReceipts={receipts as any} />
}