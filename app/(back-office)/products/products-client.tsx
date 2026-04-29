'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useNavigation } from '@/components/navigation-context'

type Variant = {
  id: string
  sku: string
  stock_qty: number
  sell_price: number
  condition: string | null
  color: string | null
  storage: string | null
  is_archived: boolean
}

type Product = {
  id: string
  name: string
  brand: string | null
  category: string | null
  is_public: boolean
  is_archived: boolean
  created_at: string
  product_variants: Variant[]
  creator: { full_name: string } | null
}

export default function ProductsClient({ initialProducts }: { initialProducts: Product[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const { setNavigating } = useNavigation()


  const categories = Array.from(new Set(initialProducts.map(p => p.category).filter(Boolean)))

  const filtered = initialProducts.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand?.toLowerCase().includes(search.toLowerCase())
    const matchCategory = !filterCategory || p.category === filterCategory
    return matchSearch && matchCategory
  })

  function totalStock(variants: Variant[]) {
    return variants.filter(v => !v.is_archived).reduce((s, v) => s + v.stock_qty, 0)
  }

  function priceRange(variants: Variant[]) {
    const prices = variants.filter(v => !v.is_archived).map(v => v.sell_price)
    if (!prices.length) return '—'
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    return min === max ? `${min.toLocaleString()} FCFA` : `${min.toLocaleString()} – ${max.toLocaleString()} FCFA`
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Produits</h1>
        <button onClick={() => { setNavigating(true); router.push('/products/new') }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          + Nouveau
        </button>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input type="text" placeholder="Rechercher par nom ou marque..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Toutes catégories</option>
          {categories.map(c => <option key={c} value={c!}>{c}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-sm">Aucun produit trouvé</p>
          <button onClick={() => { setNavigating(true); router.push('/products/new') }}
            className="mt-4 text-blue-600 text-sm hover:underline">
            Créer le premier produit
          </button>
        </div>
      ) : (
        <>
          {/* Desktop — tableau */}
          <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Produit</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Catégorie</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Variantes</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Stock</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Prix</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Créé par</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Visible</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(p => {
                  const stock = totalStock(p.product_variants)
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{p.name}</p>
                        {p.brand && <p className="text-xs text-gray-400">{p.brand}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{p.category ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {p.product_variants.filter(v => !v.is_archived).length}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          stock === 0 ? 'bg-red-100 text-red-700' :
                          stock <= 3 ? 'bg-amber-100 text-amber-700' :
                          'bg-green-100 text-green-700'
                        }`}>{stock}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{priceRange(p.product_variants)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{p.creator?.full_name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs ${p.is_public ? 'text-green-600' : 'text-gray-400'}`}>
                          {p.is_public ? '● Public' : '○ Privé'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => { setNavigating(true); router.push(`/products/${p.id}`) }}
                          className="text-xs text-blue-600 hover:underline">Voir →</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile — cards */}
          <div className="md:hidden space-y-3">
            {filtered.map(p => {
              const stock = totalStock(p.product_variants)
              return (
                <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4"
                  onClick={() => { setNavigating(true); router.push(`/products/${p.id}`) }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                      {p.brand && <p className="text-xs text-gray-400">{p.brand}</p>}
                    </div>
                    <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                      stock === 0 ? 'bg-red-100 text-red-700' :
                      stock <= 3 ? 'bg-amber-100 text-amber-700' :
                      'bg-green-100 text-green-700'
                    }`}>{stock} en stock</span>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
                    {p.category && <span>📁 {p.category}</span>}
                    <span>🔀 {p.product_variants.filter(v => !v.is_archived).length} variante{p.product_variants.filter(v => !v.is_archived).length > 1 ? 's' : ''}</span>
                    {p.creator && <span>👤 {p.creator.full_name}</span>}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-blue-600">{priceRange(p.product_variants)}</p>
                    <span className={`text-xs ${p.is_public ? 'text-green-600' : 'text-gray-400'}`}>
                      {p.is_public ? '● Public' : '○ Privé'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}