'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import Skeleton from '@/components/skeleton'

const ReceiptModal = dynamic(() => import('@/components/receipt-modal'), { ssr: false })

type Debt = {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string | null
  status: string
  total_amount: number
  amount_paid: number
  balance_due: number | null
  created_at: string | null
}

type ReceiptData = {
  receipt_number: string
  stamp_type: 'PAID' | 'DELIVERED' | 'NONE'
  order: any
  seller_name: string | null
  shop: { name: string; phone: string | null; email: string | null; address: string | null; logo_url: string | null }
}

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  DELIVERED: { label: 'Livrée', class: 'bg-blue-100 text-blue-700' },
  DEBT:      { label: 'Dette',  class: 'bg-red-100 text-red-700'  },
}

const getStatusLabel = (status: string) =>
  STATUS_LABELS[status] ?? { label: status, class: 'bg-gray-100 text-gray-700' }

const EMPTY_FORM = {
  customer_name: '',
  customer_phone: '',
  total_amount: '',
  amount_paid: '',
  notes: '',
}

export default function DebtsClient({ initialDebts }: { initialDebts: Debt[] }) {
  const [debts, setDebts]               = useState<Debt[]>(initialDebts)
  const [search, setSearch]             = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [dateFrom, setDateFrom]         = useState('')
  const [dateTo, setDateTo]             = useState('')
  const [loadingId, setLoadingId]       = useState<string | null>(null)
  const [error, setError]               = useState<string | null>(null)
  const [receiptData, setReceiptData]   = useState<ReceiptData | null>(null)

  // ── Formulaire dette manuelle ──
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  const filtered = debts.filter(d => {
    const matchSearch = d.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      d.order_number.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || d.status === filterStatus
    const matchFrom = !dateFrom || new Date(d.created_at ?? '') >= new Date(dateFrom)
    const matchTo = !dateTo || new Date(d.created_at ?? '') <= new Date(dateTo + 'T23:59:59')
    return matchSearch && matchStatus && matchFrom && matchTo
  })

  const totalDettes = debts.reduce((s, d) => s + (d.balance_due ?? 0), 0)

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

  async function handleAddDebt() {
    setFormError(null)
    const total = parseFloat(form.total_amount)
    const paid  = parseFloat(form.amount_paid || '0')

    if (!form.customer_name.trim()) return setFormError('Nom du client requis')
    if (!form.total_amount || total <= 0) return setFormError('Montant total invalide')
    if (paid < 0 || paid >= total) return setFormError('Le montant payé doit être inférieur au total')

    setFormLoading(true)
    const res = await fetch('/api/debts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: form.customer_name,
        customer_phone: form.customer_phone || null,
        total_amount: total,
        amount_paid: paid,
        notes: form.notes || null,
      }),
    })
    const data = await res.json()
    setFormLoading(false)
    if (!res.ok) return setFormError(data.error)

    setDebts(prev => [data, ...prev])
    setForm(EMPTY_FORM)
    setShowForm(false)
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Dettes</h1>
        <button
          onClick={() => { setShowForm(true); setFormError(null) }}
          className="text-sm bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition"
        >
          + Nouvelle dette
        </button>
      </div>

      {/* Stats */}
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
            {filtered.reduce((s, d) => s + (d.balance_due ?? 0), 0).toLocaleString()} FCFA
          </p>
        </div>
      </div>

      {/* Filtres */}
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
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusLabel(d.status).class}`}>
                    {getStatusLabel(d.status).label}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium">{d.total_amount.toLocaleString()} FCFA</td>
                <td className="px-4 py-3 text-green-600">{d.amount_paid.toLocaleString()} FCFA</td>
                <td className="px-4 py-3 text-red-600 font-medium">{(d.balance_due ?? 0).toLocaleString()} FCFA</td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {d.created_at ? new Date(d.created_at).toLocaleDateString('fr-FR', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  }) : '—'}
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
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusLabel(d.status).class}`}>
                {getStatusLabel(d.status).label}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs mb-3">
              <div><p className="text-gray-400">Total</p><p className="font-medium text-gray-900">{d.total_amount.toLocaleString()}</p></div>
              <div><p className="text-gray-400">Payé</p><p className="font-medium text-green-600">{d.amount_paid.toLocaleString()}</p></div>
              <div><p className="text-gray-400">Reste</p><p className="font-medium text-red-600">{(d.balance_due ?? 0).toLocaleString()}</p></div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">
                {d.created_at ? new Date(d.created_at).toLocaleDateString('fr-FR', {
                  day: '2-digit', month: 'short', year: 'numeric'
                }) : '—'}
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

      {/* Modal : nouvelle dette manuelle */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            {formLoading && (
              <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-medium text-gray-700">Enregistrement...</p>
                </div>
              </div>
            )}
            <h2 className="text-lg font-bold text-gray-900 mb-4">Nouvelle dette</h2>

            <div className="flex flex-col gap-3 mb-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nom du client *</label>
                <input
                  value={form.customer_name}
                  onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
                  placeholder="Ex. Amadou Diallo"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Téléphone</label>
                <input
                  value={form.customer_phone}
                  onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))}
                  placeholder="Ex. 70 00 00 00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Montant total *</label>
                  <input
                    type="number"
                    min="0"
                    value={form.total_amount}
                    onChange={e => setForm(f => ({ ...f, total_amount: e.target.value }))}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Avance versée</label>
                  <input
                    type="number"
                    min="0"
                    value={form.amount_paid}
                    onChange={e => setForm(f => ({ ...f, amount_paid: e.target.value }))}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
              {form.total_amount && form.amount_paid && (
                <p className="text-xs text-red-600 font-medium">
                  Reste à payer : {(parseFloat(form.total_amount || '0') - parseFloat(form.amount_paid || '0')).toLocaleString()} FCFA
                </p>
              )}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Note</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Contexte, objet de la dette..."
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>
            </div>

            {formError && <p className="text-sm text-red-600 mb-3">{formError}</p>}

            <div className="flex gap-2">
              <button
                onClick={handleAddDebt}
                disabled={formLoading}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition"
              >
                {formLoading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
              <button
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setFormError(null) }}
                className="flex-1 py-2.5 rounded-xl text-sm border border-gray-300 hover:bg-gray-50 transition"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

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