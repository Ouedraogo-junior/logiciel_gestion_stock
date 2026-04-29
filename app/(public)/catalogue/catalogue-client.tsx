'use client'
import { useState } from 'react'

type Variant = {
  id: string
  storage: string | null
  color: string | null
  condition: string | null
  sell_price: number
}

type Product = {
  id: string
  name: string
  brand: string | null
  category: string | null
  description: string | null
  product_variants: Variant[]
}

const CONDITION_STYLES: Record<string, string> = {
  Neuf: 'bg-green-100 text-green-700',
  Reconditionné: 'bg-blue-100 text-blue-700',
  Occasion: 'bg-amber-100 text-amber-700',
}

function ProductSVG({ category }: { category: string | null }) {
  const cat = category?.toLowerCase() ?? ''

  if (cat.includes('accessoire') || cat.includes('écouteur') || cat.includes('casque')) {
    return (
      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-16">
        <circle cx="40" cy="40" r="38" fill="#EFF6FF" />
        <path d="M20 40c0-11 9-20 20-20s20 9 20 20" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" fill="none"/>
        <rect x="15" y="38" width="8" height="14" rx="4" fill="#3B82F6"/>
        <rect x="57" y="38" width="8" height="14" rx="4" fill="#3B82F6"/>
      </svg>
    )
  }

  if (cat.includes('chargeur') || cat.includes('cable') || cat.includes('câble')) {
    return (
      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-16">
        <circle cx="40" cy="40" r="38" fill="#F0FDF4" />
        <rect x="30" y="18" width="20" height="28" rx="4" fill="#22C55E" opacity="0.2" stroke="#22C55E" strokeWidth="2"/>
        <path d="M35 22h10M35 28h10" stroke="#22C55E" strokeWidth="2" strokeLinecap="round"/>
        <path d="M40 46v8M34 54h12" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M37 58v4M43 58v4" stroke="#22C55E" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    )
  }

  if (cat.includes('coque') || cat.includes('protection')) {
    return (
      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-16">
        <circle cx="40" cy="40" r="38" fill="#FFF7ED" />
        <rect x="27" y="16" width="26" height="48" rx="6" fill="#F97316" opacity="0.15" stroke="#F97316" strokeWidth="2"/>
        <rect x="22" y="20" width="36" height="40" rx="8" fill="none" stroke="#F97316" strokeWidth="2.5" strokeDasharray="4 2"/>
      </svg>
    )
  }

  // Téléphone (par défaut)
  return (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-16">
      <circle cx="40" cy="40" r="38" fill="#EFF6FF" />
      <rect x="26" y="14" width="28" height="52" rx="6" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="2"/>
      <rect x="30" y="20" width="20" height="32" rx="2" fill="#93C5FD" opacity="0.5"/>
      <circle cx="40" cy="59" r="3" fill="#3B82F6"/>
      <rect x="35" y="16" width="10" height="2" rx="1" fill="#3B82F6" opacity="0.4"/>
    </svg>
  )
}

export default function CatalogueClient({ products }: { products: Product[] }) {
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))]

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand?.toLowerCase().includes(search.toLowerCase())
    const matchCategory = !filterCategory || p.category === filterCategory
    return matchSearch && matchCategory
  })

  function priceRange(variants: Variant[]) {
    const prices = variants.map(v => v.sell_price)
    if (!prices.length) return null
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    return min === max
      ? `${min.toLocaleString()} FCFA`
      : `${min.toLocaleString()} – ${max.toLocaleString()} FCFA`
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Catalogue</h1>
        <p className="text-gray-500 text-sm">
          {filtered.length} produit{filtered.length > 1 ? 's' : ''} disponible{filtered.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un produit..."
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Toutes catégories</option>
          {categories.map(c => <option key={c} value={c!}>{c}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-sm">Aucun produit trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(p => {
            const price = priceRange(p.product_variants)
            const conditions = [...new Set(p.product_variants.map(v => v.condition).filter(Boolean))]
            return (
              <div key={p.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition group">
                {/* Image SVG */}
                <div className="bg-gray-50 flex items-center justify-center py-8 border-b border-gray-100 group-hover:bg-blue-50/40 transition">
                  <ProductSVG category={p.category} />
                </div>

                {/* Contenu */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{p.name}</p>
                      {p.brand && <p className="text-xs text-gray-400 mt-0.5">{p.brand}</p>}
                    </div>
                    {p.category && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-lg shrink-0 ml-2">{p.category}</span>
                    )}
                  </div>

                  {p.description && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{p.description}</p>
                  )}

                  {/* Variantes */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {p.product_variants.slice(0, 4).map(v => (
                      <span key={v.id} className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600">
                        {[v.storage, v.color].filter(Boolean).join(' · ') || v.condition}
                      </span>
                    ))}
                    {p.product_variants.length > 4 && (
                      <span className="text-xs text-gray-400 px-2 py-1">+{p.product_variants.length - 4}</span>
                    )}
                  </div>

                  {/* Conditions */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {conditions.map(c => (
                      <span key={c} className={`text-xs px-2 py-0.5 rounded-full font-medium ${CONDITION_STYLES[c!] ?? 'bg-gray-100 text-gray-600'}`}>
                        {c}
                      </span>
                    ))}
                  </div>

                  {/* Prix */}
                  {price && (
                    <p className="text-blue-600 font-bold text-base">{price}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}