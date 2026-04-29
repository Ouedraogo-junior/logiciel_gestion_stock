'use client'
import { useState } from 'react'

type Profile = {
  full_name: string
  username: string | null
  role: string
}

export default function AccountClient({ profile }: { profile: Profile }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setError(null)
    setSuccess(false)

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    if (newPassword.length < 8) {
      setError('Mot de passe trop court (8 caractères min)')
      return
    }

    setLoading(true)
    const res = await fetch('/api/account', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }

    setSuccess(true)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setLoading(false)
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Mon compte</h1>

      {/* Infos */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <h2 className="font-semibold text-gray-800 mb-3">Informations</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Nom</span>
            <span className="font-medium text-gray-900">{profile.full_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Nom d{"'"}utilisateur</span>
            <span className="font-medium text-gray-900">@{profile.username}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Rôle</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              profile.role === 'admin'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {profile.role}
            </span>
          </div>
        </div>
      </div>

      {/* Changement MDP */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">Changer le mot de passe</h2>
        <div>
          <label className="text-xs font-medium text-gray-600">Mot de passe actuel</label>
          <input
            type="password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Nouveau mot de passe</label>
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Confirmer le mot de passe</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">✓ Mot de passe modifié avec succès</p>}

        <button
          onClick={handleSubmit}
          disabled={loading || !currentPassword || !newPassword || !confirmPassword}
          className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {loading ? 'Mise à jour...' : 'Mettre à jour'}
        </button>
      </div>
    </div>
  )
}