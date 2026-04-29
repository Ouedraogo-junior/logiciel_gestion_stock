'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const ReceiptModal = dynamic(() => import('@/components/receipt-modal'), { ssr: false })

type OrderItem = {
  id: string
  quantity: number
  unit_price: number
  discount: number
  subtotal: number
  product_variants: {
    sku: string
    color: string | null
    storage: string | null
    condition: string | null
    products: { name: string; brand: string | null } | null
  } | null
}

type Order = {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string | null
  status: string
  total_amount: number
  amount_paid: number
  balance_due: number | null  // ← nullable
  notes: string | null
  created_at: string | null   // ← nullable
  updated_at: string | null   // ← nullable
  order_items: OrderItem[]
}

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  PAID:      { label: 'Payée',  class: 'bg-green-100 text-green-700' },
  DELIVERED: { label: 'Livrée', class: 'bg-blue-100 text-blue-700'  },
  DEBT:      { label: 'Dette',  class: 'bg-red-100 text-red-700'    },
}

export default function OrderDetailClient({ order: initial }: { order: Order }) {
  const router = useRouter()
  const [order, setOrder] = useState(initial)
  const [editingPayment, setEditingPayment] = useState(false)
  const [newAmountPaid, setNewAmountPaid] = useState(String(initial.amount_paid))
  const [newStatus, setNewStatus] = useState(initial.status)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [printLoading, setPrintLoading] = useState(false)
  const [receiptData, setReceiptData] = useState<{
    receipt_number: string
    stamp_type: 'PAID' | 'DELIVERED' | 'NONE'
    order: any
    seller_name: string | null
    shop: { name: string; phone: string | null; email: string | null; address: string | null; logo_url: string | null}
  } | null>(null)

  async function handlePrint() {
    setPrintLoading(true)
    const stamp_type = order.status === 'PAID' ? 'PAID'
      : order.status === 'DELIVERED' ? 'DELIVERED' : 'NONE'
    const res = await fetch('/api/receipts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: order.id, stamp_type }),
    })
    const data = await res.json()
    if (res.ok) setReceiptData(data)
    setPrintLoading(false)
  }

  async function updateOrder() {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: newStatus,
        amount_paid: parseFloat(newAmountPaid) || 0,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    setOrder(o => ({
      ...o,
      status: newStatus,
      amount_paid: parseFloat(newAmountPaid) || 0,
      balance_due: o.total_amount - (parseFloat(newAmountPaid) || 0),
    }))
    setEditingPayment(false)
    setLoading(false)
  }

  const statusLabel = STATUS_LABELS[order.status] ?? { label: order.status, class: 'bg-gray-100 text-gray-700' }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/orders')}
          className="text-gray-400 hover:text-gray-600 text-sm">← Retour
        </button>
        <button
          onClick={handlePrint}
          disabled={printLoading}
          className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {printLoading ? '...' : '🖨 Imprimer reçu'}
        </button>
        <h1 className="text-xl font-bold text-gray-900 flex-1">{order.order_number}</h1>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusLabel.class}`}>
          {statusLabel.label}
        </span>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="grid grid-cols-3 gap-5">
        {/* Articles */}
        <div className="col-span-2 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Articles</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Produit</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Qté</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">P.U</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Remise</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.order_items.map(item => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{item.product_variants?.products?.name}</p>
                      <p className="text-xs text-gray-400">
                        {[item.product_variants?.storage, item.product_variants?.color, item.product_variants?.sku]
                          .filter(Boolean).join(' · ')}
                      </p>
                    </td>
                    <td className="px-4 py-3">{item.quantity}</td>
                    <td className="px-4 py-3">{item.unit_price.toLocaleString()}</td>
                    <td className="px-4 py-3">{item.discount > 0 ? `-${item.discount.toLocaleString()}` : '—'}</td>
                    <td className="px-4 py-3 font-medium">{item.subtotal.toLocaleString()} FCFA</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Infos & paiement */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2 text-sm">
            <h2 className="font-semibold text-gray-800 mb-3">Client</h2>
            <p className="font-medium text-gray-900">{order.customer_name}</p>
            {order.customer_phone && <p className="text-gray-500">{order.customer_phone}</p>}
            {order.notes && <p className="text-gray-400 text-xs mt-2">{order.notes}</p>}
            <p className="text-xs text-gray-400 pt-2">
              {order.created_at ? new Date(order.created_at).toLocaleDateString('fr-FR', {
                day: '2-digit', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              }) : '—'}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Paiement</h2>
              {!editingPayment && (
                <button onClick={() => setEditingPayment(true)}
                  className="text-xs text-blue-600 border border-blue-200 rounded px-2 py-1 hover:bg-blue-50">
                  Modifier
                </button>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total</span>
              <span className="font-bold">{order.total_amount.toLocaleString()} FCFA</span>
            </div>

            {!editingPayment ? (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payé</span>
                  <span className="text-green-600 font-medium">{order.amount_paid.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <span className="text-gray-500">Reste</span>
                  <span className={`font-bold ${order.balance_due != null && order.balance_due > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {order.balance_due != null && order.balance_due > 0 ? `${(order.balance_due).toLocaleString()} FCFA` : 'Soldé'}
                  </span>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <div>
                  <label className="text-xs font-medium text-gray-600">Montant payé</label>
                  <input type="number" min="0" value={newAmountPaid}
                    onChange={e => setNewAmountPaid(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Statut</label>
                  <select value={newStatus}
                    onChange={e => setNewStatus(e.target.value as typeof newStatus)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="PAID">Payée</option>
                    <option value="DELIVERED">Livrée</option>
                    <option value="DEBT">Dette</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={updateOrder} disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50">
                    {loading ? '...' : 'Enregistrer'}
                  </button>
                  <button onClick={() => setEditingPayment(false)}
                    className="flex-1 border border-gray-300 py-2 rounded-lg text-xs hover:bg-gray-50">
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {receiptData && (
        <ReceiptModal
          order={receiptData.order}
          shop={receiptData.shop}
          receipt_number={receiptData.receipt_number}
          stamp_type={receiptData.stamp_type}
          seller_name={receiptData.seller_name}
          onClose={() => setReceiptData(null)}
        />
      )}
    </div>
  )
}