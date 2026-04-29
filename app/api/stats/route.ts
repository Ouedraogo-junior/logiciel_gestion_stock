import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await admin
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin')
    return NextResponse.json({ error: 'Réservé aux admins' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const filterType = searchParams.get('type') // 'month' | 'year' | null
  const filterYear = parseInt(searchParams.get('year') ?? '') || new Date().getFullYear()
  const filterMonth = parseInt(searchParams.get('month') ?? '') || new Date().getMonth() + 1

  const now = new Date()

  // Bornes de la période filtrée
  let periodStart: Date
  let periodEnd: Date

  if (filterType === 'month') {
    periodStart = new Date(filterYear, filterMonth - 1, 1)
    periodEnd = new Date(filterYear, filterMonth, 0, 23, 59, 59)
  } else if (filterType === 'year') {
    periodStart = new Date(filterYear, 0, 1)
    periodEnd = new Date(filterYear, 11, 31, 23, 59, 59)
  } else {
    periodStart = new Date(0) // pas de filtre
    periodEnd = now
  }

  // Bornes par défaut (jour, semaine, mois courant)
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0)
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0, 0, 0, 0)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Commandes PAID — filtrées par période si applicable
  const paidQuery = admin
    .from('orders')
    .select('amount_paid, created_at')
    .eq('status', 'PAID')

  if (filterType) {
    paidQuery.gte('created_at', periodStart.toISOString()).lte('created_at', periodEnd.toISOString())
  }

  const { data: paidOrders } = await paidQuery

  const caDay = filterType ? 0 : (paidOrders ?? [])
    .filter(o => new Date(o.created_at) >= startOfDay)
    .reduce((s, o) => s + o.amount_paid, 0)

  const caWeek = filterType ? 0 : (paidOrders ?? [])
    .filter(o => new Date(o.created_at) >= startOfWeek)
    .reduce((s, o) => s + o.amount_paid, 0)

  const caPeriod = (paidOrders ?? []).reduce((s, o) => s + o.amount_paid, 0)

  const caMonth = filterType
    ? caPeriod
    : (paidOrders ?? []).filter(o => new Date(o.created_at) >= startOfMonth).reduce((s, o) => s + o.amount_paid, 0)

  // CA total toujours global
  const { data: allPaid } = await admin
    .from('orders').select('amount_paid').eq('status', 'PAID')
  const caTotal = (allPaid ?? []).reduce((s, o) => s + o.amount_paid, 0)

  // Commandes par statut — filtrées par période
  const ordersQuery = admin.from('orders').select('id, status, balance_due, created_at')
  if (filterType) {
    ordersQuery.gte('created_at', periodStart.toISOString()).lte('created_at', periodEnd.toISOString())
  }
  const { data: allOrders } = await ordersQuery

  const countPaid = (allOrders ?? []).filter(o => o.status === 'PAID').length
  const countDelivered = (allOrders ?? []).filter(o => o.status === 'DELIVERED').length
  const countDebt = (allOrders ?? []).filter(o => o.status === 'DEBT').length

  // Dettes actives — toujours global
  const { data: debtOrders } = await admin
    .from('orders').select('balance_due').neq('status', 'PAID')
  const totalDettes = (debtOrders ?? []).reduce((s, o) => s + o.balance_due, 0)

  // Stock — toujours global
  const { data: variants } = await admin
    .from('product_variants').select('buy_price, sell_price, stock_qty').eq('is_archived', false)
  const valeurStock = (variants ?? []).reduce((s, v) => s + v.buy_price * v.stock_qty, 0)

  // Marge brute — filtrée par période via order_items + orders
  const { data: orderItemsRaw } = await admin
    .from('order_items')
    .select(`quantity, unit_price, order_id, product_variants (buy_price, products (name))`)

  // Filtrer les items par période via les commandes déjà filtrées
  const filteredOrderIds = new Set((allOrders ?? []).map(o => (o as any).id))

  const orderItemsFiltered = filterType
    ? (orderItemsRaw ?? []).filter(i => filteredOrderIds.has(i.order_id))
    : (orderItemsRaw ?? [])

  const margeBrute = orderItemsFiltered.reduce((s, item) => {
    const buyPrice = (item.product_variants as any)?.buy_price ?? 0
    return s + (item.unit_price - buyPrice) * item.quantity
  }, 0)

  // Top 10 — filtré par période
  const productMap: Record<string, number> = {}
  for (const item of orderItemsFiltered) {
    const name = (item.product_variants as any)?.products?.name
    if (!name) continue
    productMap[name] = (productMap[name] ?? 0) + item.quantity
  }
  const top10 = Object.entries(productMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, qty]) => ({ name, qty }))

  // Inventaire — toujours global
  const { count: totalProducts } = await admin
    .from('products').select('*', { count: 'exact', head: true })
  const { count: totalVariants } = await admin
    .from('product_variants').select('*', { count: 'exact', head: true }).eq('is_archived', false)

  return NextResponse.json({
    ca: { day: caDay, week: caWeek, month: caMonth, total: caTotal },
    orders: { paid: countPaid, delivered: countDelivered, debt: countDebt, total: (allOrders ?? []).length },
    totalDettes,
    margeBrute,
    valeurStock,
    totalProducts: totalProducts ?? 0,
    totalVariants: totalVariants ?? 0,
    top10,
  })
}