'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'

const ReceiptModal = dynamic(() => import('@/components/receipt-modal'), { ssr: false })

type Debt = {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string | null
  status: 'DELIVERED' | 'DEBT'
  total_amount: number
  amount_paid: number
  balance_due: number
  created_at: string
}

type ReceiptData = {
  receipt_number: string
  stamp_type: 'PAID' | 'DELIVERED' | 'NONE'
  order: any
  seller_name: string | null
  shop: { name: string; phone: string | null; email: string | null; address: string | null }
}

const STATUS_LABELS = {
  DELIVERED: { label: 'Livrée', class: 'bg-blue-100 text-blue-700' },
  DEBT:      { label: 'Dette',  class: 'bg-red-100 text-red-700'  },
}

export default function DebtsClient({ initialDebts }: { initialDebts: Debt[] }) {
  const [debts, setDebts] = useState<Debt[]>(initialDebts)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)

  const filtered = debts.filter(d => {
    const matchSearch = d.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      d.order_number.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || d.status === filterStatus
    const matchFrom = !dateFrom || new Date(d.created_at) >= new Date(dateFrom)
    const matchTo = !dateTo || new Date(d.created_at) <= new Date(dateTo + 'T23:59:59')
    return matchSearch && matchStatus && matchFrom && matchTo
  })

  const totalDettes = debts.reduce((s, d) => s + d.balance_due, 0)

  async function markAsPaid(debt: Debt) {
    setLoadingId(debt.id)
    setError(null)
    const res = await fetch('/api/debts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: debt.id }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoadingId(null); return }
    setDebts(prev => prev.filter(d => d.id !== debt.id))
    setReceiptData(data)
    setLoadingId(null)
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Dettes</h1>

      {/* Stats — 1 col mobile, 3 col desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Total dettes</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{debts.length}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs text-red-600">Montant total dû</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{totalDettes.toLocaleString()} FCFA</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-xs text-orange-600">Résultats filtrés</p>
          <p className="text-2xl font-bold text-orange-700 mt-1">
            {filtered.reduce((s, d) => s + d.balance_due, 0).toLocaleString()} FCFA
          </p>
        </div>
      </div>

      {/* Filtres — stack mobile */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-5">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par client ou numéro..."
          className="w-full sm:flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Tous statuts</option>
          <option value="DELIVERED">Livrée</option>
          <option value="DEBT">Dette</option>
        </select>
        <div className="flex gap-2">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {/* Table desktop / Cards mobile */}
      <div className="hidden sm:block bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">N°</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Client</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Total</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Payé</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Reste</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">Aucune dette</td></tr>
            ) : filtered.map(d => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{d.order_number}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{d.customer_name}</p>
                  {d.customer_phone && <p className="text-xs text-gray-400">{d.customer_phone}</p>}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_LABELS[d.status].class}`}>
                    {STATUS_LABELS[d.status].label}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium">{d.total_amount.toLocaleString()} FCFA</td>
                <td className="px-4 py-3 text-green-600">{d.amount_paid.toLocaleString()} FCFA</td>
                <td className="px-4 py-3 text-red-600 font-medium">{d.balance_due.toLocaleString()} FCFA</td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(d.created_at).toLocaleDateString('fr-FR', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => markAsPaid(d)}
                    disabled={loadingId === d.id}
                    className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                  >
                    {loadingId === d.id ? '...' : '✓ Payé'}
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
          <p className="text-center py-8 text-gray-400 text-sm">Aucune dette</p>
        ) : filtered.map(d => (
          <div key={d.id} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-medium text-gray-900">{d.customer_name}</p>
                {d.customer_phone && <p className="text-xs text-gray-400">{d.customer_phone}</p>}
                <p className="font-mono text-xs text-gray-400 mt-0.5">{d.order_number}</p>
              </div>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_LABELS[d.status].class}`}>
                {STATUS_LABELS[d.status].label}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs mb-3">
              <div>
                <p className="text-gray-400">Total</p>
                <p className="font-medium text-gray-900">{d.total_amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-400">Payé</p>
                <p className="font-medium text-green-600">{d.amount_paid.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-400">Reste</p>
                <p className="font-medium text-red-600">{d.balance_due.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">
                {new Date(d.created_at).toLocaleDateString('fr-FR', {
                  day: '2-digit', month: 'short', year: 'numeric'
                })}
              </p>
              <button
                onClick={() => markAsPaid(d)}
                disabled={loadingId === d.id}
                className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
              >
                {loadingId === d.id ? '...' : '✓ Payé'}
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