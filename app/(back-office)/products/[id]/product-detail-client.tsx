'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CATEGORIES = ['Téléphone', 'Accessoire', 'Chargeur', 'Écouteurs', 'Coque / Protection', 'Câble', 'Autre']
const CONDITIONS = ['Neuf', 'Reconditionné', 'Occasion'] as const

type Variant = {
  id: string
  sku: string
  storage: string | null
  color: string | null
  condition: string | null
  buy_price: number
  sell_price: number
  stock_qty: number
  alert_threshold: number
  is_archived: boolean | null  // ← nullable
  created_at: string | null    // ← nullable
}

type Product = {
  id: string
  name: string
  brand: string | null
  category: string | null
  description: string | null
  is_public: boolean | null    // ← nullable
  is_archived: boolean | null  // ← nullable
  created_at: string | null    // ← nullable
  product_variants: Variant[]
}

function emptyVariantForm() {
  return { storage: '', color: '', condition: 'Neuf' as const, buy_price: '', sell_price: '', alert_threshold: '2', stock_initial: '0' }
}

export default function ProductDetailClient({ product: initial }: { product: Product }) {
  const router = useRouter()
  const [product, setProduct] = useState(initial)
  const [editingProduct, setEditingProduct] = useState(false)
  const [productForm, setProductForm] = useState({
    name: initial.name,
    brand: initial.brand ?? '',
    category: initial.category ?? '',
    description: initial.description ?? '',
    is_public: initial.is_public ?? false
  })
  const [showAddVariant, setShowAddVariant] = useState(false)
  const [newVariant, setNewVariant] = useState(emptyVariantForm())
  const [editingVariant, setEditingVariant] = useState<string | null>(null)
  const [variantForms, setVariantForms] = useState<Record<string, {
    storage: string, color: string, condition: string,
    buy_price: string, sell_price: string, alert_threshold: string
  }>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function patch(body: Record<string, unknown>) {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return false }
    return true
  }

  async function saveProduct() {
    const ok = await patch({ type: 'product', ...productForm })
    if (ok) {
      setProduct(p => ({ ...p, ...productForm }))
      setEditingProduct(false)
    }
  }

  async function archiveProduct() {
    if (!confirm(product.is_archived ? 'Désarchiver ce produit ?' : 'Archiver ce produit ?')) return
    const ok = await patch({ type: 'archive_product', is_archived: !product.is_archived })
    if (ok) router.push('/products')
  }

  function startEditVariant(v: Variant) {
    setEditingVariant(v.id)
    setVariantForms(f => ({
      ...f,
      [v.id]: {
        storage: v.storage ?? '',
        color: v.color ?? '',
        condition: v.condition ?? 'Neuf',
        buy_price: String(v.buy_price),
        sell_price: String(v.sell_price),
        alert_threshold: String(v.alert_threshold),
      }
    }))
  }

  async function saveVariant(variantId: string) {
    const f = variantForms[variantId]
    const ok = await patch({ type: 'variant', variant_id: variantId, ...f })
    if (ok) {
      setProduct(p => ({
        ...p,
        product_variants: p.product_variants.map(v =>
          v.id === variantId ? {
            ...v,
            storage: f.storage || null,
            color: f.color || null,
            condition: f.condition,
            buy_price: parseFloat(f.buy_price),
            sell_price: parseFloat(f.sell_price),
            alert_threshold: parseInt(f.alert_threshold),
          } : v
        )
      }))
      setEditingVariant(null)
    }
  }

  async function archiveVariant(v: Variant) {
    if (!confirm(v.is_archived ? 'Désarchiver cette variante ?' : 'Archiver cette variante ?')) return
    const ok = await patch({ type: 'archive_variant', variant_id: v.id, is_archived: !v.is_archived })
    if (ok) {
      setProduct(p => ({
        ...p,
        product_variants: p.product_variants.map(pv =>
          pv.id === v.id ? { ...pv, is_archived: !v.is_archived } : pv
        )
      }))
    }
  }

  async function addVariant() {
    const ok = await patch({ type: 'add_variant', ...newVariant })
    if (ok) {
      setShowAddVariant(false)
      setNewVariant(emptyVariantForm())
      router.refresh()
      // Recharger les données
      const res = await fetch(`/api/products/${product.id}`)
      const data = await res.json()
      setProduct(data)
    }
  }

  const activeVariants = product.product_variants.filter(v => !v.is_archived)
  const archivedVariants = product.product_variants.filter(v => v.is_archived)


  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/products')}
          className="text-gray-400 hover:text-gray-600 text-sm">← Retour</button>
        <h1 className="text-xl font-bold text-gray-900 flex-1">{product.name}</h1>
        <button onClick={archiveProduct}
          className="text-xs text-red-400 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50">
          {product.is_archived ? 'Désarchiver' : 'Archiver'}
        </button>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {/* Infos produit */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Informations générales</h2>
          {!editingProduct ? (
            <button onClick={() => setEditingProduct(true)}
              className="text-xs text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50">
              Modifier
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={saveProduct} disabled={loading}
                className="text-xs bg-blue-600 text-white rounded-lg px-3 py-1.5 hover:bg-blue-700 disabled:opacity-50">
                {loading ? '...' : 'Enregistrer'}
              </button>
              <button onClick={() => setEditingProduct(false)}
                className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50">
                Annuler
              </button>
            </div>
          )}
        </div>

        {!editingProduct ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Nom :</span> <span className="font-medium">{product.name}</span></div>
            <div><span className="text-gray-500">Marque :</span> <span className="font-medium">{product.brand ?? '—'}</span></div>
            <div><span className="text-gray-500">Catégorie :</span> <span className="font-medium">{product.category ?? '—'}</span></div>
            <div><span className="text-gray-500">Visible :</span> <span className={product.is_public ? 'text-green-600 font-medium' : 'text-gray-400'}>
              {product.is_public ? 'Public' : 'Privé'}
            </span></div>
            {product.description && (
              <div className="col-span-2"><span className="text-gray-500">Description :</span> {product.description}</div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600">Nom *</label>
              <input required value={productForm.name}
                onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Marque</label>
              <input value={productForm.brand}
                onChange={e => setProductForm(f => ({ ...f, brand: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Catégorie</label>
              <select value={productForm.category}
                onChange={e => setProductForm(f => ({ ...f, category: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600">Description</label>
              <textarea value={productForm.description}
                onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))}
                rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="is_public" checked={productForm.is_public}
                onChange={e => setProductForm(f => ({ ...f, is_public: e.target.checked }))}
                className="rounded" />
              <label htmlFor="is_public" className="text-sm text-gray-700">Visible sur la page publique</label>
            </div>
          </div>
        )}
      </div>

      {/* Variantes actives */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Variantes ({activeVariants.length})</h2>
          <button onClick={() => setShowAddVariant(!showAddVariant)}
            className="text-xs text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50">
            + Ajouter une variante
          </button>
        </div>

        {/* Formulaire ajout variante */}
        {showAddVariant && (
          <div className="border border-blue-100 rounded-lg p-4 mb-4 bg-blue-50 space-y-3">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Nouvelle variante</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Stockage', key: 'storage', placeholder: 'ex: 128 Go' },
                { label: 'Couleur', key: 'color', placeholder: 'ex: Noir' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-gray-600">{f.label}</label>
                  <input value={newVariant[f.key as keyof typeof newVariant]}
                    onChange={e => setNewVariant(v => ({ ...v, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-gray-600">État</label>
                <select value={newVariant.condition}
                  onChange={e => setNewVariant(v => ({ ...v, condition: e.target.value as typeof v.condition }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Prix d{"'"}achat (FCFA)</label>
                <input type="number" min="0" value={newVariant.buy_price}
                  onChange={e => setNewVariant(v => ({ ...v, buy_price: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Prix de vente (FCFA)</label>
                <input type="number" min="0" value={newVariant.sell_price}
                  onChange={e => setNewVariant(v => ({ ...v, sell_price: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Stock initial</label>
                <input type="number" min="0" value={newVariant.stock_initial}
                  onChange={e => setNewVariant(v => ({ ...v, stock_initial: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={addVariant} disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {loading ? '...' : 'Ajouter'}
              </button>
              <button onClick={() => setShowAddVariant(false)}
                className="px-4 py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-50">
                Annuler
              </button>
            </div>
          </div>
        )}

        {activeVariants.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Aucune variante active</p>
        ) : (
          <div className="space-y-3">
            {activeVariants.map(v => (
              <div key={v.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                {editingVariant !== v.id ? (
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-gray-400">{v.sku}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          v.stock_qty === 0 ? 'bg-red-100 text-red-700' :
                          v.stock_qty <= v.alert_threshold ? 'bg-amber-100 text-amber-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {v.stock_qty} en stock
                        </span>
                      </div>
                      <div className="text-sm text-gray-700 flex gap-3">
                        {v.storage && <span>💾 {v.storage}</span>}
                        {v.color && <span>🎨 {v.color}</span>}
                        <span>📋 {v.condition}</span>
                      </div>
                      <div className="text-sm flex gap-3">
                        <span className="text-gray-500">Achat : <span className="font-medium">{v.buy_price.toLocaleString()} FCFA</span></span>
                        <span className="text-gray-500">Vente : <span className="font-medium text-blue-600">{v.sell_price.toLocaleString()} FCFA</span></span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEditVariant(v)}
                        className="text-xs text-blue-600 border border-blue-200 rounded px-2 py-1 hover:bg-blue-50">
                        Modifier
                      </button>
                      <button onClick={() => archiveVariant(v)}
                        className="text-xs text-red-400 border border-red-200 rounded px-2 py-1 hover:bg-red-50">
                        Archiver
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      {(['storage', 'color'] as const).map(field => (
                        <div key={field}>
                          <label className="text-xs font-medium text-gray-600 capitalize">{field === 'storage' ? 'Stockage' : 'Couleur'}</label>
                          <input value={variantForms[v.id]?.[field] ?? ''}
                            onChange={e => setVariantForms(f => ({ ...f, [v.id]: { ...f[v.id], [field]: e.target.value } }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                      ))}
                      <div>
                        <label className="text-xs font-medium text-gray-600">État</label>
                        <select value={variantForms[v.id]?.condition ?? 'Neuf'}
                          onChange={e => setVariantForms(f => ({ ...f, [v.id]: { ...f[v.id], condition: e.target.value } }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                          {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Prix d{"'"}achat (FCFA)</label>
                        <input type="number" value={variantForms[v.id]?.buy_price ?? ''}
                          onChange={e => setVariantForms(f => ({ ...f, [v.id]: { ...f[v.id], buy_price: e.target.value } }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Prix de vente (FCFA)</label>
                        <input type="number" value={variantForms[v.id]?.sell_price ?? ''}
                          onChange={e => setVariantForms(f => ({ ...f, [v.id]: { ...f[v.id], sell_price: e.target.value } }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Seuil alerte</label>
                        <input type="number" value={variantForms[v.id]?.alert_threshold ?? '2'}
                          onChange={e => setVariantForms(f => ({ ...f, [v.id]: { ...f[v.id], alert_threshold: e.target.value } }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => saveVariant(v.id)} disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                        {loading ? '...' : 'Enregistrer'}
                      </button>
                      <button onClick={() => setEditingVariant(null)}
                        className="px-4 py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-50">
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Variantes archivées */}
      {archivedVariants.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 opacity-60">
          <h2 className="font-semibold text-gray-500 mb-3">Variantes archivées ({archivedVariants.length})</h2>
          <div className="space-y-2">
            {archivedVariants.map(v => (
              <div key={v.id} className="flex items-center justify-between border border-gray-100 rounded-lg p-3">
                <div className="text-sm text-gray-500">
                  <span className="font-mono text-xs">{v.sku}</span>
                  {v.storage && <span className="ml-2">{v.storage}</span>}
                  {v.color && <span className="ml-2">{v.color}</span>}
                </div>
                <button onClick={() => archiveVariant(v)}
                  className="text-xs text-gray-500 border border-gray-200 rounded px-2 py-1 hover:bg-gray-50">
                  Désarchiver
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}