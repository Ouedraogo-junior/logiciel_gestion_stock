'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type LowStockItem = {
  sku: string
  color: string | null
  storage: string | null
  condition: string | null
  stock_qty: number
  alert_threshold: number
  products: { name: string } | null
}

type TopProduct = {
  name: string
  qty: number
}

type DashboardData = {
  caToday: number
  totalDettes: number
  lowStock: LowStockItem[]
  top5: TopProduct[]
}

export default function DashboardClient() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <p className="text-sm text-gray-400">Chargement...</p>
      </div>
    )
  }

  if (!data) return null

  const maxQty = Math.max(...data.top5.map(p => p.qty), 1)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Tableau de bord</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <p className="text-xs text-green-600 font-medium">CA du jour</p>
          <p className="text-3xl font-bold text-green-700 mt-1">
            {data.caToday.toLocaleString()}
          </p>
          <p className="text-xs text-green-500 mt-1">FCFA encaissés aujourd{"'"}hui</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="text-xs text-red-600 font-medium">Dettes actives</p>
          <p className="text-3xl font-bold text-red-700 mt-1">
            {data.totalDettes.toLocaleString()}
          </p>
          <p className="text-xs text-red-400 mt-1">
            FCFA à recouvrer
          </p>
          {data.totalDettes > 0 && (
            <button
              onClick={() => router.push('/debts')}
              className="mt-2 text-xs text-red-600 underline hover:text-red-800"
            >
              Voir les dettes →
            </button>
          )}
        </div>
      </div>

      {/* Top 5 produits */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Top 5 produits vendus</h2>
        {data.top5.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Aucune vente enregistrée</p>
        ) : (
          <div className="space-y-3">
            {data.top5.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{p.name}</span>
                    <span className="text-xs text-gray-500">{p.qty} vendus</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${(p.qty / maxQty) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alertes stock faible */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Alertes stock faible</h2>
          {data.lowStock.length > 0 && (
            <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {data.lowStock.length} article{data.lowStock.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {data.lowStock.length === 0 ? (
          <p className="text-sm text-green-600">✓ Tous les stocks sont suffisants</p>
        ) : (
          <div className="space-y-2">
            {data.lowStock.map(item => (
              <div key={item.sku}
                className="flex items-center justify-between px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.products?.name}</p>
                  <p className="text-xs text-gray-400">
                    {[item.storage, item.color, item.condition, item.sku].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-600">{item.stock_qty} restant{item.stock_qty > 1 ? 's' : ''}</p>
                  <p className="text-xs text-gray-400">seuil : {item.alert_threshold}</p>
                </div>
              </div>
            ))}
            <button
              onClick={() => router.push('/stock')}
              className="w-full text-xs text-blue-600 border border-blue-200 rounded-lg py-2 hover:bg-blue-50 mt-1"
            >
              Gérer le stock →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}