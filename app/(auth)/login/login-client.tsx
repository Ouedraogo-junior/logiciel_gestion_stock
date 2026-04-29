'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

type Shop = { name: string | null; logo_url: string | null } | null

export default function LoginClient({ shop }: { shop: Shop }) {
  const router = useRouter()
  const supabase = createClient()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const fakeEmail = `${username.trim().toLowerCase()}@boutique.local`
    const { error } = await supabase.auth.signInWithPassword({ email: fakeEmail, password })
    if (error) { setError('Identifiant ou mot de passe incorrect.'); setLoading(false); return }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-8">
        {/* Logo + Nom */}
        <div className="flex flex-col items-center mb-6">
          {shop?.logo_url ? (
            <Image src={shop.logo_url} alt="logo" width={56} height={56}
              className="rounded-xl object-contain mb-3" />
          ) : (
            <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-3">
              {shop?.name?.[0] ?? 'B'}
            </div>
          )}
          <h1 className="text-lg font-bold text-gray-900">{shop?.name ?? 'Boutique'}</h1>
          <p className="text-xs text-gray-400 mt-0.5">Espace de gestion</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom d{"'"}utilisateur</label>
            <input type="text" required placeholder="nom d'utilisateur" value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input type="password" required value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition">
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}