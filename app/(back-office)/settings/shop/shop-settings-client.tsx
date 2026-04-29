'use client'
import { useState, useRef } from 'react'
import Image from 'next/image'

type ShopSettings = {
  name: string
  phone: string | null
  email: string | null
  address: string | null
  description: string | null
  logo_url: string | null
}

export default function ShopSettingsClient({ initialShop }: { initialShop: ShopSettings }) {
  const [form, setForm] = useState<ShopSettings>(initialShop)
  const [loading, setLoading] = useState(false)
  const [logoLoading, setLogoLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('logo', file)

    const res = await fetch('/api/settings/shop', {
      method: 'PUT',
      body: formData,
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLogoLoading(false); return }
    setForm(f => ({ ...f, logo_url: data.logo_url }))
    setLogoLoading(false)
  }

  async function handleSave() {
    setLoading(true)
    setSuccess(false)
    setError(null)

    const res = await fetch('/api/settings/shop', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    setSuccess(true)
    setLoading(false)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Paramètres boutique</h1>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">

        {/* Logo */}
        <div>
          <label className="text-xs font-medium text-gray-600">Logo</label>
          <div className="mt-2 flex items-center gap-4">
            {form.logo_url ? (
              <Image
                src={form.logo_url}
                alt="Logo boutique"
                width={80}
                height={80}
                className="rounded-xl object-contain border border-gray-200"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">
                Aucun logo
              </div>
            )}
            <div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={logoLoading}
                className="text-sm text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 disabled:opacity-50"
              >
                {logoLoading ? 'Upload...' : 'Changer le logo'}
              </button>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG — max 2 Mo</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600">Nom de la boutique *</label>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Téléphone</label>
          <input
            value={form.phone ?? ''}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value || null }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Email</label>
          <input
            type="email"
            value={form.email ?? ''}
            onChange={e => setForm(f => ({ ...f, email: e.target.value || null }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Adresse</label>
          <input
            value={form.address ?? ''}
            onChange={e => setForm(f => ({ ...f, address: e.target.value || null }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Description</label>
          <textarea
            rows={3}
            value={form.description ?? ''}
            onChange={e => setForm(f => ({ ...f, description: e.target.value || null }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">✓ Paramètres enregistrés</p>}

        <button
          onClick={handleSave}
          disabled={loading || !form.name}
          className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}