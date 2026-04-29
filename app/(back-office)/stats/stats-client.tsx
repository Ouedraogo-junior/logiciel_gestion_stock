'use client'
import { useState, useEffect } from 'react'

type Period = { type: 'month'; year: number; month: number } | { type: 'year'; year: number }

type StatsData = {
  ca: { day: number; week: number; month: number; total: number }
  orders: { paid: number; delivered: number; debt: number; total: number }
  totalDettes: number
  margeBrute: number
  valeurStock: number
  totalProducts: number
  totalVariants: number
  top10: { name: string; qty: number }[]
}

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

function buildYears() {
  const current = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => current - i)
}

export default function StatsClient() {
  const now = new Date()
  const [filterType, setFilterType] = useState<'default' | 'month' | 'year'>('default')
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    let url = '/api/stats'
    if (filterType === 'month') url += `?type=month&year=${selectedYear}&month=${selectedMonth + 1}`
    if (filterType === 'year') url += `?type=year&year=${selectedYear}`
    fetch(url)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [filterType, selectedMonth, selectedYear])

  const years = buildYears()

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">

      {/* Header — stack mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <h1 className="text-xl font-bold text-gray-900">Statistiques</h1>

        <div className="flex flex-wrap items-center gap-2">
          <select value={filterType} onChange={e => setFilterType(e.target.value as typeof filterType)}
            className="flex-1 sm:flex-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="default">Période par défaut</option>
            <option value="month">Par mois</option>
            <option value="year">Par année</option>
          </select>

          {filterType !== 'default' && (
            <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          )}

          {filterType === 'month' && (
            <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          )}
        </div>
      </div>

      {loading ? (
      <>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
              <div className="h-2.5 w-20 bg-gray-200 rounded mb-2" />
              <div className="h-7 w-24 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`bg-white border border-gray-200 rounded-xl p-5 animate-pulse ${i === 2 ? 'sm:col-span-2' : ''}`}>
              <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex justify-between py-2 border-b border-gray-100">
                  <div className="h-3 w-28 bg-gray-200 rounded" />
                  <div className="h-3 w-16 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
          <div className="h-4 w-40 bg-gray-200 rounded mb-4" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div className="h-3 w-4 bg-gray-200 rounded" />
              <div className="flex-1">
                <div className="h-3 w-40 bg-gray-200 rounded mb-1" />
                <div className="h-1.5 bg-gray-100 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </>
    ) : !data ? null : (
        <>
          {filterType !== 'default' && (
            <p className="text-xs text-gray-400">
              Période : {filterType === 'month' ? `${MONTHS[selectedMonth]} ${selectedYear}` : `Année ${selectedYear}`}
            </p>
          )}

          {/* CA — 2 col mobile, 4 col desktop */}
          <div>
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Chiffre d{"'"}affaires</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Aujourd'hui", value: data.ca.day },
                { label: 'Cette semaine', value: data.ca.week },
                { label: filterType === 'month' ? MONTHS[selectedMonth] : filterType === 'year' ? `Année ${selectedYear}` : 'Ce mois', value: data.ca.month },
                { label: 'Total', value: data.ca.total },
              ].map(s => (
                <div key={s.label} className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-xs text-green-600">{s.label}</p>
                  <p className="text-lg sm:text-xl font-bold text-green-700 mt-1">{s.value.toLocaleString()}</p>
                  <p className="text-xs text-green-500">FCFA</p>
                </div>
              ))}
            </div>
          </div>

          {/* Commandes + Finances + Inventaire — 1 col mobile, 2 col desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="font-semibold text-gray-800 mb-4">Commandes</h2>
              <div className="space-y-3">
                {[
                  { label: 'Total', value: data.orders.total, color: 'text-gray-900' },
                  { label: 'Payées', value: data.orders.paid, color: 'text-green-600' },
                  { label: 'Livrées', value: data.orders.delivered, color: 'text-blue-600' },
                  { label: 'Dettes', value: data.orders.debt, color: 'text-red-600' },
                ].map(s => (
                  <div key={s.label} className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">{s.label}</span>
                    <span className={`font-bold ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="font-semibold text-gray-800 mb-4">Finances</h2>
              <div className="space-y-3">
                {[
                  { label: 'Dettes actives', value: `${data.totalDettes.toLocaleString()} FCFA`, color: 'text-red-600' },
                  { label: 'Marge brute', value: `${data.margeBrute.toLocaleString()} FCFA`, color: 'text-purple-600' },
                  { label: 'Valeur du stock', value: `${data.valeurStock.toLocaleString()} FCFA`, color: 'text-blue-600' },
                ].map(s => (
                  <div key={s.label} className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">{s.label}</span>
                    <span className={`font-bold ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 sm:col-span-2">
              <h2 className="font-semibold text-gray-800 mb-4">Inventaire</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Produits actifs', value: data.totalProducts },
                  { label: 'Variantes actives', value: data.totalVariants },
                ].map(s => (
                  <div key={s.label} className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">{s.label}</span>
                    <span className="font-bold text-gray-900">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top 10 */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Top 10 produits vendus</h2>
            {data.top10.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Aucune vente enregistrée</p>
            ) : (
              <div className="space-y-3">
                {data.top10.map((p, i) => {
                  const maxQty = Math.max(...data.top10.map(x => x.qty), 1)
                  return (
                    <div key={p.name} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-400 w-5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1 gap-2">
                          <span className="text-sm font-medium text-gray-900 truncate">{p.name}</span>
                          <span className="text-xs text-gray-500 shrink-0">{p.qty} vendus</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${(p.qty / maxQty) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}