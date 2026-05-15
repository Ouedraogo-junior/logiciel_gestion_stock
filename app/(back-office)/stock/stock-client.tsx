'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useNavigation } from '@/components/navigation-context'

const REASONS_IN = ['Achat', 'Retour', 'Correction']
const REASONS_OUT = ['Perte', 'Correction']

type Product = { name: string; brand: string | null }
type Variant = {
  id: string
  sku: string
  color: string | null
  storage: string | null
  condition: string | null
  stock_qty: number
  alert_threshold: number | null
  products: Product | null
}

type Movement = {
  id: string
  type: 'IN' | 'OUT'  // ← union type
  quantity: number
  reason: string | null
  note: string | null
  created_at: string
  created_by: string | null
  creator: { full_name: string } | null  
  product_variants: {
    id: string
    sku: string
    color: string | null
    storage: string | null
    stock_qty: number
    products: { name: string; brand: string | null } | null
  } | null
}

export default function StockClient({
  variants: initialVariants,
  movements: initialMovements,
}: {
  variants: Variant[]
  movements: Movement[]
}) {
  const router = useRouter()
  const [variants, setVariants] = useState(initialVariants)
  const [movements, setMovements] = useState(initialMovements)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    variant_id: '',
    type: 'IN' as 'IN' | 'OUT',
    quantity: '1',
    reason: 'Achat',
    note: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const { setNavigating } = useNavigation()
  const [showVariantPicker, setShowVariantPicker] = useState(false)
  const [showAllLowStock, setShowAllLowStock] = useState(false)


  const reasons = form.type === 'IN' ? REASONS_IN : REASONS_OUT

  function variantLabel(v: Variant) {
    const parts = [v.products?.name, v.products?.brand, v.storage, v.color, v.condition].filter(Boolean)
    return `${parts.join(' · ')} (${v.sku})`
  }

  const filteredVariants = variants.filter(v =>
    variantLabel(v).toLowerCase().includes(search.toLowerCase())
  )

  const lowStock = variants.filter(v => v.alert_threshold !== null && v.stock_qty <= v.alert_threshold)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const qty = parseInt(form.quantity)
    const res = await fetch('/api/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, quantity: qty }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }

    // ✅ Met à jour le stock localement sans refetch
    setVariants(prev => prev.map(v =>
      v.id === form.variant_id
        ? { ...v, stock_qty: form.type === 'IN' ? v.stock_qty + qty : v.stock_qty - qty }
        : v
    ))

    // ✅ Ajoute le mouvement en tête de liste localement
    setMovements(prev => [{
      id: crypto.randomUUID(),
      type: form.type,
      quantity: qty,
      reason: form.reason,
      note: form.note || null,
      created_at: new Date().toISOString(),
      created_by: null,
      creator: null,
      product_variants: variants.find(v => v.id === form.variant_id) as any ?? null,
    }, ...prev].slice(0, 50))

    setShowForm(false)
    setForm({ variant_id: '', type: 'IN', quantity: '1', reason: 'Achat', note: '' })
    setLoading(false)

    // ✅ Revalide en arrière-plan sans bloquer l'UI
    router.refresh()
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Stock</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          + Mouvement
        </button>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
          <p className="text-sm font-semibold text-amber-800 mb-2">
            ⚠ {lowStock.length} variante{lowStock.length > 1 ? 's' : ''} en stock faible
          </p>
          <div className="space-y-1">
            {(showAllLowStock ? lowStock : lowStock.slice(0, 3)).map(v => (
              <div key={v.id} className="flex items-center justify-between text-xs text-amber-700">
                <span className="truncate mr-2">{v.products?.name} {v.storage && `· ${v.storage}`} {v.color && `· ${v.color}`} ({v.sku})</span>
                <span className="font-bold shrink-0">{v.stock_qty} restant{v.stock_qty > 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
          {lowStock.length > 3 && (
            <button
              onClick={() => setShowAllLowStock(s => !s)}
              className="mt-2 text-xs text-amber-700 font-medium hover:underline"
            >
              {showAllLowStock ? 'Voir moins ↑' : `Voir ${lowStock.length - 3} de plus ↓`}
            </button>
          )}
        </div>
      )}

      {/* Formulaire mouvement */}
      {showForm && (
        <form onSubmit={handleSubmit} className="relative bg-white border border-gray-200 rounded-xl p-5 mb-6 space-y-4">
          {loading && (
            <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium text-gray-700">Enregistrement...</p>
              </div>
            </div>
          )}
          <h2 className="font-semibold text-gray-800">Nouveau mouvement</h2>
          <div>
            <label className="text-xs font-medium text-gray-600">Variante *</label>
            <button
              type="button"
              onClick={() => setShowVariantPicker(true)}
              className="w-full mt-1 bg-blue-600 text-white rounded-lg px-3 py-2 text-sm text-left font-medium hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {form.variant_id
                ? variantLabel(variants.find(v => v.id === form.variant_id)!)
                : <span className="text-blue-200">Sélectionner une variante...</span>
              }
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Type *</label>
              <select value={form.type}
                onChange={e => {
                  const type = e.target.value as 'IN' | 'OUT'
                  setForm(f => ({ ...f, type, reason: type === 'IN' ? 'Achat' : 'Perte' }))
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="IN">Entrée</option>
                <option value="OUT">Sortie</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Quantité *</label>
              <input required type="number" min="1" value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Raison *</label>
              <select value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {reasons.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Note (optionnel)</label>
            <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              placeholder="Note libre..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-50">
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Derniers mouvements */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 text-sm">Derniers mouvements</h2>
          <button onClick={() => { setNavigating(true); router.push('/stock/history') }}
            className="text-xs text-blue-600 hover:underline">Voir tout →</button>
        </div>

        {/* Desktop — tableau */}
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Produit</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Qté</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Raison</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Par</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {movements.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm">Aucun mouvement</td></tr>
              ) : movements.map(m => (
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
                    }`}>{m.type === 'IN' ? '↑ Entrée' : '↓ Sortie'}</span>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <span className={m.type === 'IN' ? 'text-green-600' : 'text-red-600'}>
                      {m.type === 'IN' ? '+' : '-'}{m.quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{m.reason ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(m.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{m.creator?.full_name ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile — cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {movements.length === 0 ? (
            <p className="text-center py-8 text-gray-400 text-sm">Aucun mouvement</p>
          ) : movements.map(m => (
            <div key={m.id} className="px-4 py-3">
              <div className="flex items-start justify-between mb-1">
                <div className="flex-1 min-w-0 mr-2">
                  <p className="font-medium text-gray-900 text-sm truncate">{m.product_variants?.products?.name ?? '—'}</p>
                  <p className="text-xs text-gray-400">
                    {[m.product_variants?.storage, m.product_variants?.color, m.product_variants?.sku].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                  m.type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>{m.type === 'IN' ? '↑ Entrée' : '↓ Sortie'}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className={`font-semibold ${m.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                  {m.type === 'IN' ? '+' : '-'}{m.quantity}
                </span>
                {m.reason && <span>· {m.reason}</span>}
                <span>· {m.creator?.full_name ?? '—'}</span>
                <span className="ml-auto text-gray-400">
                  {new Date(m.created_at).toLocaleDateString('fr-FR', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Variant Picker Modal */}
      {showVariantPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl flex flex-col max-h-[70vh]">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-3">Choisir une variante</h3>
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Nom, SKU, couleur..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
              {filteredVariants.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-sm">Aucun résultat</p>
              ) : filteredVariants.map(v => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setForm(f => ({ ...f, variant_id: v.id }))
                    setShowVariantPicker(false)
                    setSearch('')
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition ${
                    form.variant_id === v.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900">{v.products?.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {[v.products?.brand, v.storage, v.color, v.condition].filter(Boolean).join(' · ')} · {v.sku}
                  </p>
                  <p className={`text-xs font-medium mt-0.5 ${
                    v.alert_threshold !== null && v.stock_qty <= v.alert_threshold
                      ? 'text-amber-600' : 'text-gray-500'
                  }`}>
                    {v.stock_qty} en stock
                  </p>
                </button>
              ))}
            </div>
            <div className="p-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => { setShowVariantPicker(false); setSearch('') }}
                className="w-full py-2 rounded-xl text-sm border border-gray-300 hover:bg-gray-50 transition"
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