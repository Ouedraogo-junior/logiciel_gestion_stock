'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'

const ReceiptModal = dynamic(() => import('@/components/receipt-modal'), { ssr: false })

type Receipt = {
  id: string
  receipt_number: string
  stamp_type: 'PAID' | 'DELIVERED' | 'NONE'
  generated_at: string
  generated_by: string | null
  seller_name: string | null
  orders: {
    id: string
    order_number: string
    customer_name: string
    status: string
    total_amount: number
    amount_paid: number
    balance_due: number
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

export default function ReceiptsClient({ initialReceipts }: { initialReceipts: Receipt[] }) {
  const [search, setSearch] = useState('')
  const [filterStamp, setFilterStamp] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)

  const filtered = initialReceipts.filter(r => {
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

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Reçus</h1>

      {/* Stats — 1 col mobile, 3 col desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Total reçus</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{initialReceipts.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs text-green-600">Reçus Payé</p>
          <p className="text-2xl font-bold text-green-700 mt-1">
            {initialReceipts.filter(r => r.stamp_type === 'PAID').length}
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs text-blue-600">Reçus Livré</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">
            {initialReceipts.filter(r => r.stamp_type === 'DELIVERED').length}
          </p>
        </div>
      </div>

      {/* Filtres — stack mobile */}
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
                  <button
                    onClick={() => reprint(r)}
                    disabled={loadingId === r.id}
                    className="text-xs text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition"
                  >
                    {loadingId === r.id ? '...' : '🖨 Réimprimer'}
                  </button>
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

            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">
                {new Date(r.generated_at).toLocaleDateString('fr-FR', {
                  day: '2-digit', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </p>
              <button
                onClick={() => reprint(r)}
                disabled={loadingId === r.id}
                className="text-xs text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition"
              >
                {loadingId === r.id ? '...' : '🖨 Réimprimer'}
              </button>
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
    </div>
  )
}