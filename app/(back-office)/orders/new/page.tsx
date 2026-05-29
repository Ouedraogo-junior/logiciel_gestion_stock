// app/(back-office)/orders/new/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useNavigation } from '@/components/navigation-context'
const ReceiptModal = dynamic(() => import('@/components/receipt-modal'), { ssr: false })

type Product = { name: string; brand: string | null }
type Variant = {
  id: string
  sku: string
  color: string | null
  storage: string | null
  condition: string | null
  sell_price: number
  stock_qty: number
  products: Product | null
}

type CartItem = {
  variant: Variant
  quantity: number
  unit_price: number
  discount: number
}

type ReceiptData = {
  id: string
  receipt_number: string
  stamp_type: 'PAID' | 'DELIVERED' | 'NONE'
  order: any
  seller_name: string | null
  shop: { name: string; phone: string | null; email: string | null; address: string | null; logo_url: string | null }
}

export default function NewOrderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editOrderId   = searchParams.get('edit')
  const editReceiptId = searchParams.get('receipt')
  const isEditMode    = !!editOrderId && !!editReceiptId

  const [variants, setVariants]       = useState<Variant[]>([])
  const [search, setSearch]           = useState('')
  const [cart, setCart]               = useState<CartItem[]>([])
  const [form, setForm]               = useState({
    customer_name: '',
    customer_phone: '',
    status: 'PAID' as 'PAID' | 'DELIVERED' | 'DEBT',
    amount_paid: '',
    notes: '',
  })
  const [loadingInit, setLoadingInit] = useState(isEditMode)
  const [error, setError]             = useState<string | null>(null)
  const [loading, setLoading]         = useState(false)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const { setNavigating }             = useNavigation()

  // ── Charger les variantes disponibles ─────────────────────────────────────
  useEffect(() => {
    fetch('/api/products/variants')
      .then(r => r.json())
      .then(setVariants)
  }, [])

  // ── En mode édition : pré-remplir le formulaire depuis la commande ─────────
  useEffect(() => {
    if (!isEditMode) return

    fetch(`/api/orders/${editOrderId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); setLoadingInit(false); return }

        setForm({
          customer_name:  data.customer_name  ?? '',
          customer_phone: data.customer_phone ?? '',
          status:         data.status         ?? 'PAID',
          amount_paid:    String(data.amount_paid ?? ''),
          notes:          data.notes          ?? '',
        })

        // Reconstruire le panier depuis order_items
        type RawItem = {
          variant_id: string
          quantity: number
          unit_price: number
          discount: number
          product_variants?: {
            sku: string
            color: string | null
            storage: string | null
            products?: { name: string } | null
          } | null
        }

        const rawItems: RawItem[] = data.order_items ?? []

        setCart(rawItems.map(item => {
          // Enrichir depuis variants déjà chargées si dispo
          const found = variants.find(v => v.id === item.variant_id)
          if (found) {
            return { variant: found, quantity: item.quantity, unit_price: item.unit_price, discount: item.discount }
          }
          // Placeholder minimal depuis product_variants jointé par l'API
          const pv = item.product_variants
          return {
            variant: {
              id: item.variant_id,
              sku:        pv?.sku      ?? '',
              color:      pv?.color    ?? null,
              storage:    pv?.storage  ?? null,
              condition:  null,
              sell_price: item.unit_price,
              stock_qty:  9999,
              products:   { name: pv?.products?.name ?? 'Article', brand: null },
            },
            quantity:   item.quantity,
            unit_price: item.unit_price,
            discount:   item.discount,
          }
        }))

        setLoadingInit(false)
      })
      .catch(() => { setError('Erreur lors du chargement de la commande'); setLoadingInit(false) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, editOrderId])

  // ── Enrichir les items placeholder une fois les variantes chargées ─────────
  useEffect(() => {
    if (!isEditMode || !variants.length) return
    setCart(prev => prev.map(item => {
      const found = variants.find(v => v.id === item.variant.id)
      return found ? { ...item, variant: found } : item
    }))
  }, [variants, isEditMode])

  const filtered = variants.filter(v => {
    const label = [v.products?.name, v.products?.brand, v.sku, v.color, v.storage]
      .filter(Boolean).join(' ').toLowerCase()
    return search ? label.includes(search.toLowerCase()) : true
  })

  function addToCart(variant: Variant) {
    setCart(c => {
      const existing = c.find(i => i.variant.id === variant.id)
      if (existing) {
        return c.map(i => i.variant.id === variant.id
          ? { ...i, quantity: i.quantity + 1 }
          : i)
      }
      return [...c, { variant, quantity: 1, unit_price: variant.sell_price, discount: 0 }]
    })
    setSearch('')
  }

  function updateCartItem(variantId: string, field: 'quantity' | 'unit_price' | 'discount', value: number) {
    setCart(c => c.map(i => i.variant.id === variantId ? { ...i, [field]: value } : i))
  }

  function removeFromCart(variantId: string) {
    setCart(c => c.filter(i => i.variant.id !== variantId))
  }

  const total      = cart.reduce((s, i) => s + (i.quantity * i.unit_price - i.discount), 0)
  const amountPaid = parseFloat(form.amount_paid) || 0
  const balance    = total - amountPaid

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const overStock = cart.find(i => i.quantity > i.variant.stock_qty)
    if (overStock) {
      setError(`Stock insuffisant pour "${overStock.variant.products?.name}" (max ${overStock.variant.stock_qty})`)
      return
    }

    if (cart.length === 0) { setError('Ajoutez au moins un article'); return }
    setLoading(true)
    setError(null)

    const payload = {
      ...form,
      items: cart.map(i => ({
        variant_id: i.variant.id,
        quantity:   i.quantity,
        unit_price: i.unit_price,
        discount:   i.discount,
      })),
    }

    const res = isEditMode
      ? await fetch('/api/orders', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, order_id: editOrderId, receipt_id: editReceiptId }),
        })
      : await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    setReceiptData(data)
    setLoading(false)
  }

  if (receiptData) {
    return (
      <ReceiptModal
        order={receiptData.order}
        shop={receiptData.shop}
        receipt_number={receiptData.receipt_number}
        stamp_type={receiptData.stamp_type}
        seller_name={receiptData.seller_name}
        onClose={() => router.push('/receipts')}
      />
    )
  }

  if (loadingInit) {
    return (
      <div className="fixed inset-0 z-50 bg-white/60 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-white border border-gray-200 rounded-2xl px-8 py-6 flex flex-col items-center gap-3 shadow-lg">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-gray-700">Chargement de la commande...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {loading && (
        <div className="fixed inset-0 z-50 bg-white/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white border border-gray-200 rounded-2xl px-8 py-6 flex flex-col items-center gap-3 shadow-lg">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-gray-700">
              {isEditMode ? 'Mise à jour en cours...' : 'Enregistrement en cours...'}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => { setNavigating(true); router.back() }} className="text-gray-400 hover:text-gray-600 text-sm">
          ← Retour
        </button>
        <h1 className="text-xl font-bold text-gray-900">
          {isEditMode ? 'Modifier la vente' : 'Nouvelle vente'}
        </h1>
        {isEditMode && (
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
            Modification — l{"'"}ancien reçu sera annulé
          </span>
        )}
      </div>

      <div className="grid grid-cols-5 gap-5">
        {/* Recherche produits */}
        <div className="col-span-3 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="font-semibold text-gray-800 mb-3">Ajouter des articles</h2>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un produit..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />
            {search && (
              <div className="border border-gray-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Aucun résultat</p>
                ) : filtered.slice(0, 10).map(v => (
                  <button key={v.id} onClick={() => addToCart(v)}
                    disabled={v.stock_qty === 0}
                    className="w-full text-left px-3 py-2.5 hover:bg-blue-50 border-b border-gray-100 last:border-0 disabled:opacity-40 disabled:cursor-not-allowed">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{v.products?.name}</p>
                        <p className="text-xs text-gray-400">
                          {[v.storage, v.color, v.condition, v.sku].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-blue-600">{v.sell_price.toLocaleString()} FCFA</p>
                        <p className="text-xs text-gray-400">{v.stock_qty} en stock</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Panier */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="font-semibold text-gray-800 mb-3">Panier ({cart.length})</h2>
            {cart.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Aucun article</p>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.variant.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.variant.products?.name}</p>
                        <p className="text-xs text-gray-400">
                          {[item.variant.storage, item.variant.color, item.variant.sku].filter(Boolean).join(' · ')}
                        </p>
                        <span className={`inline-flex items-center gap-1 text-sm font-semibold rounded-full px-2 py-0.5 mt-1 ${
                          item.variant.stock_qty === 0
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : item.variant.stock_qty <= 3
                            ? 'bg-amber-50 text-amber-600 border border-amber-200'
                            : 'bg-green-50 text-green-600 border border-green-200'
                        }`}>
                          📦 Stock : {item.variant.stock_qty}
                        </span>
                      </div>
                      <button onClick={() => removeFromCart(item.variant.id)}
                        className="text-xs text-red-400 hover:text-red-600">✕</button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-gray-500">Qté</label>
                        <input
                          type="number" min="1"
                          max={item.variant.stock_qty}
                          value={item.quantity}
                          onChange={e => updateCartItem(item.variant.id, 'quantity', parseInt(e.target.value) || 1)}
                          className={`w-full border rounded px-2 py-1 text-sm mt-0.5 focus:outline-none focus:ring-1 ${
                            item.quantity > item.variant.stock_qty
                              ? 'border-red-500 focus:ring-red-500 bg-red-50'
                              : 'border-gray-300 focus:ring-blue-500'
                          }`}
                        />
                        {item.quantity > item.variant.stock_qty && (
                          <p className="text-xs text-red-500 mt-0.5">
                            Stock insuffisant ({item.variant.stock_qty} dispo)
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Prix unitaire</label>
                        <input type="number" min="0" value={item.unit_price}
                          onChange={e => updateCartItem(item.variant.id, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm mt-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Remise</label>
                        <input type="number" min="0" value={item.discount}
                          onChange={e => updateCartItem(item.variant.id, 'discount', parseFloat(e.target.value) || 0)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm mt-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </div>
                    </div>
                    <p className="text-right text-sm font-medium text-gray-900 mt-2">
                      {(item.quantity * item.unit_price - item.discount).toLocaleString()} FCFA
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Récapitulatif & infos client */}
        <div className="col-span-2 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <h2 className="font-semibold text-gray-800">Client</h2>
            <div>
              <label className="text-xs font-medium text-gray-600">Nom *</label>
              <input required value={form.customer_name}
                onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Téléphone</label>
              <input value={form.customer_phone}
                onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Notes</label>
              <textarea value={form.notes} rows={2}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <h2 className="font-semibold text-gray-800">Paiement</h2>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total</span>
              <span className="font-bold text-gray-900">{total.toLocaleString()} FCFA</span>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Montant encaissé</label>
              <input type="number" min="0" value={form.amount_paid}
                onChange={e => setForm(f => ({ ...f, amount_paid: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Reste à payer</span>
              <span className={`font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {balance.toLocaleString()} FCFA
              </span>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Statut</label>
              <select value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as typeof form.status }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="PAID">Payée</option>
                <option value="DELIVERED">Livrée (dette)</option>
                <option value="DEBT">Dette formelle</option>
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button onClick={handleSubmit} disabled={loading || cart.length === 0}
            className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition">
            {loading
              ? (isEditMode ? 'Mise à jour...' : 'Enregistrement...')
              : (isEditMode ? 'Valider la modification' : 'Valider la vente')}
          </button>
        </div>
      </div>
    </div>
  )
}