'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useNavigation } from '@/components/navigation-context'

type Movement = {
  id: string
  type: string              // ← string au lieu de l'union
  quantity: number
  reason: string | null
  note: string | null
  created_at: string | null // ← nullable
  product_variants: {
    sku: string
    color: string | null
    storage: string | null
    condition: string | null
    stock_qty: number
    products: { name: string; brand: string | null } | null
  } | null
}

export default function HistoryClient({ movements }: { movements: Movement[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterReason, setFilterReason] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const { setNavigating } = useNavigation()

  const filtered = movements.filter(m => {
    const label = [
      m.product_variants?.products?.name,
      m.product_variants?.sku,
      m.product_variants?.color,
      m.product_variants?.storage,
    ].filter(Boolean).join(' ').toLowerCase()

    const matchSearch = !search || label.includes(search.toLowerCase())
    const matchType = !filterType || m.type === filterType
    const matchReason = !filterReason || m.reason === filterReason
    const matchFrom = !dateFrom || new Date(m.created_at ?? '') >= new Date(dateFrom)
    const matchTo = !dateTo || new Date(m.created_at ?? '') <= new Date(dateTo + 'T23:59:59')

    return matchSearch && matchType && matchReason && matchFrom && matchTo
  })

  const totalIn = filtered.filter(m => m.type === 'IN').reduce((s, m) => s + m.quantity, 0)
  const totalOut = filtered.filter(m => m.type === 'OUT').reduce((s, m) => s + m.quantity, 0)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => { setNavigating(true); router.push('/stock') }}
          className="text-gray-400 hover:text-gray-600 text-sm">← Retour</button>
        <h1 className="text-xl font-bold text-gray-900">Historique des mouvements</h1>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Total mouvements</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{filtered.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs text-green-600">Total entrées</p>
          <p className="text-2xl font-bold text-green-700 mt-1">+{totalIn}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs text-red-600">Total sorties</p>
          <p className="text-2xl font-bold text-red-700 mt-1">-{totalOut}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher..."
          className="col-span-2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Tous types</option>
          <option value="IN">Entrée</option>
          <option value="OUT">Sortie</option>
        </select>
        <select value={filterReason} onChange={e => setFilterReason(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Toutes raisons</option>
          {['Achat', 'Vente', 'Retour', 'Correction', 'Perte'].map(r =>
            <option key={r} value={r}>{r}</option>
          )}
        </select>
        <div className="flex gap-2">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Produit</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Qté</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Raison</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Note</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Aucun mouvement</td></tr>
            ) : filtered.map(m => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{m.product_variants?.products?.name ?? '—'}</p>
                  <p className="text-xs text-gray-400">
                    {[m.product_variants?.storage, m.product_variants?.color, m.product_variants?.sku].filter(Boolean).join(' · ')}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    m.type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {m.type === 'IN' ? '↑ Entrée' : '↓ Sortie'}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium">
                  <span className={m.type === 'IN' ? 'text-green-600' : 'text-red-600'}>
                    {m.type === 'IN' ? '+' : '-'}{m.quantity}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{m.reason ?? '—'}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{m.note ?? '—'}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(m.created_at ?? '').toLocaleDateString('fr-FR', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}