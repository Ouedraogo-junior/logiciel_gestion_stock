'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const ReceiptModal = dynamic(() => import('@/components/receipt-modal'), { ssr: false })

type Receipt = {
  id: string
  receipt_number: string
  stamp_type: 'PAID' | 'DELIVERED' | 'NONE'
  generated_at: string
  generated_by: string | null
  seller_name: string | null
  returned_qty: number
  orders: {
    id: string
    order_number: string
    customer_name: string
    status: string
    total_amount: number
    amount_paid: number
    balance_due: number
    order_items: {
      id: string
      quantity: number
      product_variants: {
        id: string
        sku: string
        color: string | null
        storage: string | null
        products: { name: string } | null
      } | null
    }[]
  } | null
}

type ReceiptData = {
  receipt_number: string
  stamp_type: 'PAID' | 'DELIVERED' | 'NONE'
  order: any
  seller_name: string | null
  shop: { name: string; phone: string | null; email: string | null; address: string | null; logo_url: string | null }
}

const STAMP_LABELS = {
  PAID:      { label: 'Payé',  class: 'bg-green-100 text-green-700' },
  DELIVERED: { label: 'Livré', class: 'bg-blue-100 text-blue-700'  },
  NONE:      { label: 'Aucun', class: 'bg-gray-100 text-gray-600'  },
}

function totalSold(r: Receipt) {
  return r.orders?.order_items.reduce((s, i) => s + i.quantity, 0) ?? 0
}

export default function ReceiptsClient({ initialReceipts }: { initialReceipts: Receipt[] }) {
  const router = useRouter()
  const [receipts, setReceipts]         = useState<Receipt[]>(initialReceipts)
  const [search, setSearch]             = useState('')
  const [filterStamp, setFilterStamp]   = useState('')
  const [dateFrom, setDateFrom]         = useState('')
  const [dateTo, setDateTo]             = useState('')
  const [loadingId, setLoadingId]       = useState<string | null>(null)
  const [error, setError]               = useState<string | null>(null)
  const [receiptData, setReceiptData]   = useState<ReceiptData | null>(null)

  // ── Modal retour ──
  const [returnModal, setReturnModal]     = useState<{ receipt: Receipt } | null>(null)
  const [returnQtys, setReturnQtys]       = useState<Record<string, number>>({})
  const [returnError, setReturnError]     = useState<string | null>(null)
  const [returnLoading, setReturnLoading] = useState(false)

  const filtered = receipts.filter(r => {
    const matchSearch =
      r.receipt_number.toLowerCase().includes(search.toLowerCase()) ||
      r.orders?.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      r.orders?.order_number.toLowerCase().includes(search.toLowerCase())
    const matchStamp = !filterStamp || r.stamp_type === filterStamp
    const matchFrom = !dateFrom || new Date(r.generated_at) >= new Date(dateFrom)
    const matchTo = !dateTo || new Date(r.generated_at) <= new Date(dateTo + 'T23:59:59')
    return matchSearch && matchStamp && matchFrom && matchTo
  })

  async function reprint(receipt: Receipt) {
    if (!receipt.orders) return
    setLoadingId(receipt.id)
    setError(null)
    const res = await fetch('/api/receipts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: receipt.orders.id, stamp_type: receipt.stamp_type }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoadingId(null); return }
    setReceiptData(data)
    setLoadingId(null)
  }

  function openEdit(receipt: Receipt) {
    if (!receipt.orders) return
    router.push(`/orders/new?edit=${receipt.orders.id}&receipt=${receipt.id}`)
  }

  async function submitReturn() {
    if (!returnModal?.receipt.orders) return
    setReturnError(null)

    const items = returnModal.receipt.orders.order_items
      .filter(item => item.product_variants && (returnQtys[item.id] ?? 0) > 0)
      .map(item => ({
        variant_id: item.product_variants!.id,
        quantity: returnQtys[item.id],
      }))

    if (!items.length) return setReturnError('Sélectionnez au moins un article')

    setReturnLoading(true)
    const res = await fetch('/api/receipts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: returnModal.receipt.orders.id,
        receipt_id: returnModal.receipt.id,
        items,
      }),
    })
    const data = await res.json()
    setReturnLoading(false)

    if (!res.ok) return setReturnError(data.error)

    const totalReturned = Object.values(returnQtys).reduce((s, q) => s + q, 0)
    setReceipts(prev => prev.map(r =>
      r.id === returnModal.receipt.id
        ? { ...r, returned_qty: r.returned_qty + totalReturned }
        : r
    ))
    setReturnModal(null)
    setReturnQtys({})
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">

      {loadingId && (
        <div className="fixed inset-0 z-50 bg-white/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white border border-gray-200 rounded-2xl px-8 py-6 flex flex-col items-center gap-3 shadow-lg">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-gray-700">Préparation du reçu...</p>
          </div>
        </div>
      )}

      <h1 className="text-xl font-bold text-gray-900 mb-6">Reçus</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Total reçus</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{receipts.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs text-green-600">Reçus Payé</p>
          <p className="text-2xl font-bold text-green-700 mt-1">
            {receipts.filter(r => r.stamp_type === 'PAID').length}
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs text-blue-600">Reçus Livré</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">
            {receipts.filter(r => r.stamp_type === 'DELIVERED').length}
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-5">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par reçu, client ou commande..."
          className="w-full sm:flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <select value={filterStamp} onChange={e => setFilterStamp(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Tous cachets</option>
          <option value="PAID">Payé</option>
          <option value="DELIVERED">Livré</option>
          <option value="NONE">Aucun</option>
        </select>
        <div className="flex gap-2">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {/* Table desktop */}
      <div className="hidden sm:block bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">N° Reçu</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Commande</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Client</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Cachet</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Montant</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Généré par</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">Aucun reçu</td></tr>
            ) : filtered.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.receipt_number}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.orders?.order_number ?? '—'}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{r.orders?.customer_name ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STAMP_LABELS[r.stamp_type].class}`}>
                    {STAMP_LABELS[r.stamp_type].label}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium">{r.orders?.total_amount.toLocaleString() ?? '—'} FCFA</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{r.seller_name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(r.generated_at).toLocaleDateString('fr-FR', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-col items-end gap-1.5">
                    {r.returned_qty > 0 && (
                      <span className="text-xs text-orange-600 font-medium">
                        ↩ {r.returned_qty}/{totalSold(r)} retourné{r.returned_qty > 1 ? 's' : ''}
                      </span>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(r)}
                        disabled={!!loadingId}
                        className="text-xs bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 disabled:opacity-50 transition"
                      >
                        ✏️ Modifier
                      </button>
                      <button
                        onClick={() => { setReturnModal({ receipt: r }); setReturnQtys({}); setReturnError(null) }}
                        disabled={!!loadingId || r.returned_qty >= totalSold(r)}
                        className={`text-xs px-3 py-1.5 rounded-lg transition ${
                          r.returned_qty >= totalSold(r)
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50'
                        }`}
                      >
                        ↩ Retour
                      </button>
                      <button
                        onClick={() => reprint(r)}
                        disabled={!!loadingId}
                        className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                      >
                        🖨 Réimprimer
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards mobile */}
      <div className="sm:hidden flex flex-col gap-3">
        {filtered.length === 0 ? (
          <p className="text-center py-8 text-gray-400 text-sm">Aucun reçu</p>
        ) : filtered.map(r => (
          <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-medium text-gray-900">{r.orders?.customer_name ?? '—'}</p>
                <p className="font-mono text-xs text-gray-400 mt-0.5">{r.receipt_number}</p>
                <p className="font-mono text-xs text-gray-400">{r.orders?.order_number ?? '—'}</p>
              </div>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STAMP_LABELS[r.stamp_type].class}`}>
                {STAMP_LABELS[r.stamp_type].label}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div>
                <p className="text-gray-400">Montant</p>
                <p className="font-medium text-gray-900">{r.orders?.total_amount.toLocaleString() ?? '—'} FCFA</p>
              </div>
              <div>
                <p className="text-gray-400">Généré par</p>
                <p className="font-medium text-gray-900">{r.seller_name ?? '—'}</p>
              </div>
            </div>
            {r.returned_qty > 0 && (
              <p className="text-xs text-orange-600 font-medium mb-2">
                ↩ {r.returned_qty}/{totalSold(r)} retourné{r.returned_qty > 1 ? 's' : ''}
              </p>
            )}
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">
                {new Date(r.generated_at).toLocaleDateString('fr-FR', {
                  day: '2-digit', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(r)}
                  disabled={!!loadingId}
                  className="text-xs bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 disabled:opacity-50 transition"
                >
                  ✏️ Modifier
                </button>
                <button
                  onClick={() => { setReturnModal({ receipt: r }); setReturnQtys({}); setReturnError(null) }}
                  disabled={!!loadingId || r.returned_qty >= totalSold(r)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition ${
                    r.returned_qty >= totalSold(r)
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50'
                  }`}
                >
                  ↩ Retour
                </button>
                <button
                  onClick={() => reprint(r)}
                  disabled={!!loadingId}
                  className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  🖨 Réimprimer
                </button>
              </div>
            </div>
          </div>
        ))}
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

      {/* Modal retour */}
      {returnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            {returnLoading && (
              <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <h2 className="text-lg font-bold text-gray-900 mb-1">Retour de marchandise</h2>
            <p className="text-sm text-gray-500 mb-4">
              {returnModal.receipt.orders?.customer_name} — {returnModal.receipt.receipt_number}
            </p>

            <div className="flex flex-col gap-3 mb-4">
              {returnModal.receipt.orders?.order_items.map(item => {
                const v = item.product_variants
                if (!v) return null
                const label = [v.products?.name, v.storage, v.color].filter(Boolean).join(' · ')
                const alreadyReturned = returnModal.receipt.returned_qty
                const remaining = item.quantity - Math.min(alreadyReturned, item.quantity)
                return (
                  <div key={item.id} className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{label}</p>
                      <p className="text-xs text-gray-400">
                        {v.sku} — vendu : {item.quantity}{remaining < item.quantity ? ` · retournable : ${remaining}` : ''}
                      </p>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max={remaining}
                      value={returnQtys[item.id] ?? 0}
                      onChange={e => setReturnQtys(q => ({ ...q, [item.id]: parseInt(e.target.value) || 0 }))}
                      disabled={remaining === 0}
                      className="w-16 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </div>
                )
              })}
            </div>

            {returnError && <p className="text-sm text-red-600 mb-3">{returnError}</p>}

            <div className="flex gap-2">
              <button
                onClick={submitReturn}
                disabled={returnLoading}
                className="flex-1 bg-orange-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition"
              >
                Confirmer le retour
              </button>
              <button
                onClick={() => { setReturnModal(null); setReturnQtys({}); setReturnError(null) }}
                className="flex-1 py-2.5 rounded-xl text-sm border border-gray-300 hover:bg-gray-50 transition"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}