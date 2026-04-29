'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CATEGORIES = ['Téléphone', 'Accessoire', 'Chargeur', 'Écouteurs', 'Coque / Protection', 'Câble', 'Autre']
const CONDITIONS = ['Neuf', 'Reconditionné', 'Occasion'] as const

type VariantForm = {
  storage: string
  color: string
  condition: 'Neuf' | 'Reconditionné' | 'Occasion'
  buy_price: string
  sell_price: string
  alert_threshold: string
  stock_initial: string
}

function emptyVariant(): VariantForm {
  return { storage: '', color: '', condition: 'Neuf', buy_price: '', sell_price: '', alert_threshold: '2', stock_initial: '0'}
}

export default function NewProductPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '', brand: '', category: 'Téléphone', description: '', is_public: false
  })
  const [variants, setVariants] = useState<VariantForm[]>([emptyVariant()])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function updateVariant(i: number, field: keyof VariantForm, value: string) {
    setVariants(vs => vs.map((v, idx) => idx === i ? { ...v, [field]: value } : v))
  }

  function addVariant() { setVariants(vs => [...vs, emptyVariant()]) }

  function removeVariant(i: number) {
    if (variants.length === 1) return
    setVariants(vs => vs.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, variants }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    router.push('/products')
    router.refresh()
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-sm">← Retour</button>
        <h1 className="text-xl font-bold text-gray-900">Nouveau produit</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Infos produit */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Informations générales</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600">Nom du produit *</label>
              <input required value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="ex: iPhone 15 Pro"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Marque</label>
              <input value={form.brand}
                onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                placeholder="ex: Apple"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Catégorie</label>
              <select value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600">Description</label>
              <textarea value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2} placeholder="Description optionnelle..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="is_public" checked={form.is_public}
                onChange={e => setForm(f => ({ ...f, is_public: e.target.checked }))}
                className="rounded" />
              <label htmlFor="is_public" className="text-sm text-gray-700">
                Visible sur la page publique (catalogue)
              </label>
            </div>
          </div>
        </div>

        {/* Variantes */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Variantes</h2>
            <button type="button" onClick={addVariant}
              className="text-xs text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50">
              + Ajouter une variante
            </button>
          </div>

          {variants.map((v, i) => (
            <div key={i} className="border border-gray-100 rounded-lg p-4 space-y-3 bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Variante {i + 1}</p>
                {variants.length > 1 && (
                  <button type="button" onClick={() => removeVariant(i)}
                    className="text-xs text-red-400 hover:text-red-600">✕ Supprimer</button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600">Stockage</label>
                  <input value={v.storage} onChange={e => updateVariant(i, 'storage', e.target.value)}
                    placeholder="ex: 128 Go"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Couleur</label>
                  <input value={v.color} onChange={e => updateVariant(i, 'color', e.target.value)}
                    placeholder="ex: Noir"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">État *</label>
                  <select value={v.condition} onChange={e => updateVariant(i, 'condition', e.target.value as typeof v.condition)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Prix d{"'"}achat (FCFA) *</label>
                  <input required type="number" min="0" value={v.buy_price}
                    onChange={e => updateVariant(i, 'buy_price', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Prix de vente (FCFA) *</label>
                  <input required type="number" min="0" value={v.sell_price}
                    onChange={e => updateVariant(i, 'sell_price', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Seuil alerte stock</label>
                  <input type="number" min="0" value={v.alert_threshold}
                    onChange={e => updateVariant(i, 'alert_threshold', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                    <label className="text-xs font-medium text-gray-600">Stock initial</label>
                    <input type="number" min="0" value={v.stock_initial}
                        onChange={e => updateVariant(i, 'stock_initial', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
              </div>
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition">
            {loading ? 'Enregistrement...' : 'Créer le produit'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 py-2 rounded-lg text-sm text-gray-600 border border-gray-300 hover:bg-gray-50">
            Annuler
          </button>
        </div>
      </form>
    </div>
  )
}