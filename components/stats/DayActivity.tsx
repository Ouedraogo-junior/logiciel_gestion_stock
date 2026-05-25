'use client'

export type SaleItem = {
  id: string
  order_number: string
  customer_name: string
  amount_paid: number
  created_at: string
  order_items: {
    quantity: number
    unit_price: number
    product_variants: { products: { name: string } | null } | null
  }[]
}

export type DebtActivity = {
  amount: number
  payment_type: 'partial' | 'full'
  paid_at: string
  orders: { customer_name: string; order_number: string } | null
}

type Props = {
  todaySales: SaleItem[]
  todayDebtActivity: DebtActivity[]
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default function DayActivity({ todaySales = [], todayDebtActivity = [] }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

      {/* Ventes du jour */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Ventes du jour</h2>
          <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
            {todaySales.length} vente{todaySales.length > 1 ? 's' : ''}
          </span>
        </div>
        {todaySales.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Aucune vente aujourd{"'"}hui</p>
        ) : (
          <div className="space-y-3">
            {todaySales.map(sale => {
              const products = sale.order_items
                .map(i => (i.product_variants as any)?.products?.name)
                .filter(Boolean)
                .join(', ')
              return (
                <div key={sale.id} className="px-3 py-2.5 bg-green-50 border border-green-100 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{sale.customer_name}</p>
                    <p className="text-xs text-gray-400">{formatTime(sale.created_at)}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{products}</p>
                  <p className="text-sm font-bold text-green-600 mt-1">{sale.amount_paid.toLocaleString()} FCFA</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Activités dettes du jour */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Dettes du jour</h2>
          <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
            {todayDebtActivity.length} activité{todayDebtActivity.length > 1 ? 's' : ''}
          </span>
        </div>
        {todayDebtActivity.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Aucune activité dette aujourd{"'"}hui</p>
        ) : (
          <div className="space-y-3">
            {todayDebtActivity.map((activity, i) => (
              <div key={i} className="px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">{activity.orders?.customer_name}</p>
                  <p className="text-xs text-gray-400">{formatTime(activity.paid_at)}</p>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{activity.orders?.order_number}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    activity.payment_type === 'full'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {activity.payment_type === 'full' ? 'Soldé' : 'Avance'}
                  </span>
                  <p className="text-sm font-bold text-blue-600">{activity.amount.toLocaleString()} FCFA</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}