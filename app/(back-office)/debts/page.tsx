import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DebtsClient from './debts-client'

export default async function DebtsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: debts } = await admin
    .from('orders')
    .select(`
      id, order_number, customer_name, customer_phone,
      status, total_amount, amount_paid, balance_due, created_at
    `)
    .in('status', ['DELIVERED', 'DEBT'])
    .order('created_at', { ascending: false })

  return <DebtsClient initialDebts={debts ?? []} />
}