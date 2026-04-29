'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Order = {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string | null
  status: 'PAID' | 'DELIVERED' | 'DEBT'
  total_amount: number
  amount_paid: number
  balance_due: number
  created_at: string
  creator: { full_name: string } | null
}

const STATUS_LABELS = {
  PAID:      { label: 'Payée', class: 'bg-green-100 text-green-700' },
  DELIVERED: { label: 'Livrée', class: 'bg-blue-100 text-blue-700' },
  DEBT:      { label: 'Dette', class: 'bg-red-100 text-red-700' },
}

export default function OrdersClient({ initialOrders }: { initialOrders: Order[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const filtered = initialOrders.filter(o => {
    const matchSearch = o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.order_number.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || o.status === filterStatus
    return matchSearch && matchStatus
  })

  const totalCA = initialOrders
    .filter(o => o.status === 'PAID')
    .reduce((s, o) => s + o.amount_paid, 0)

  const totalDettes = initialOrders
    .filter(o => o.status !== 'PAID')
    .reduce((s, o) => s + o.balance_due, 0)

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Ventes</h1>
        <button
          onClick={() => router.push('/orders/new')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          + Nouvelle vente
        </button>
      </div>

      {/* Stats — 1 col mobile, 3 col desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Total commandes</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{initialOrders.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs text-green-600">CA encaissé</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{totalCA.toLocaleString()} FCFA</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs text-red-600">Dettes actives</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{totalDettes.toLocaleString()} FCFA</p>
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
          <option value="PAID">Payée</option>
          <option value="DELIVERED">Livrée</option>
          <option value="DEBT">Dette</option>
        </select>
      </div>

      {/* Table desktop */}
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
              <th className="text-left px-4 py-3 font-medium text-gray-600">Par</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-8 text-gray-400">Aucune commande</td></tr>
            ) : filtered.map(o => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{o.order_number}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{o.customer_name}</p>
                  {o.customer_phone && <p className="text-xs text-gray-400">{o.customer_phone}</p>}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_LABELS[o.status].class}`}>
                    {STATUS_LABELS[o.status].label}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium">{o.total_amount.toLocaleString()} FCFA</td>
                <td className="px-4 py-3 text-green-600">{o.amount_paid.toLocaleString()} FCFA</td>
                <td className="px-4 py-3 text-red-600">
                  {o.balance_due > 0 ? `${o.balance_due.toLocaleString()} FCFA` : '—'}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(o.created_at).toLocaleDateString('fr-FR', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{o.creator?.full_name ?? '—'}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => router.push(`/orders/${o.id}`)}
                    className="text-xs text-blue-600 hover:underline">
                    Voir →
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
          <p className="text-center py-8 text-gray-400 text-sm">Aucune commande</p>
        ) : filtered.map(o => (
          <div key={o.id} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-medium text-gray-900">{o.customer_name}</p>
                {o.customer_phone && <p className="text-xs text-gray-400">{o.customer_phone}</p>}
                <p className="font-mono text-xs text-gray-400 mt-0.5">{o.order_number}</p>
              </div>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_LABELS[o.status].class}`}>
                {STATUS_LABELS[o.status].label}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs mb-3">
              <div>
                <p className="text-gray-400">Total</p>
                <p className="font-medium text-gray-900">{o.total_amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-400">Payé</p>
                <p className="font-medium text-green-600">{o.amount_paid.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-400">Reste</p>
                <p className="font-medium text-red-600">
                  {o.balance_due > 0 ? o.balance_due.toLocaleString() : '—'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-400">
                <span>{new Date(o.created_at).toLocaleDateString('fr-FR', {
                  day: '2-digit', month: 'short', year: 'numeric'
                })}</span>
                {o.creator?.full_name && (
                  <span className="ml-2">· {o.creator.full_name}</span>
                )}
              </div>
              <button onClick={() => router.push(`/orders/${o.id}`)}
                className="text-xs text-blue-600 hover:underline shrink-0">
                Voir →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}