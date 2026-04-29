'use client'
import { useEffect, useState } from 'react'

type UserProfile = {
  id: string
  full_name: string
  username: string | null
  role: 'admin' | 'vendeur'
  is_active: boolean
  must_change_password: boolean
  created_at: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<{
    username: string
    password: string
    full_name: string
    role: 'vendeur' | 'admin'
  }>({ username: '', password: '', full_name: '', role: 'vendeur' })
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function fetchUsers() {
    const res = await fetch('/api/users')
    const data = await res.json()
    setUsers(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setFormError(data.error); setSubmitting(false); return }
    setShowForm(false)
    setForm({ username: '', password: '', full_name: '', role: 'vendeur' })
    fetchUsers()
    setSubmitting(false)
  }

  async function toggleActive(u: UserProfile) {
    await fetch(`/api/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !u.is_active }),
    })
    fetchUsers()
  }

  async function changeRole(u: UserProfile, role: string) {
    await fetch(`/api/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    fetchUsers()
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Utilisateurs</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          + Nouvel utilisateur
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-xl p-5 mb-6 space-y-3">
          <h2 className="font-semibold text-gray-800 mb-2">Créer un utilisateur</h2>
          {/* Formulaire — 1 col mobile, 2 col desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Nom complet</label>
              <input required value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Nom d{"'"}utilisateur</label>
              <input required value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="ex: vendeur1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Mot de passe</label>
              <input required type="password" minLength={8} value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Rôle</label>
              <select value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value as 'admin' | 'vendeur' }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1">
                <option value="vendeur">Vendeur</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={submitting}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {submitting ? 'Création...' : 'Créer'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg text-sm text-gray-600 border border-gray-300 hover:bg-gray-50">
              Annuler
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Chargement...</p>
      ) : (
        <>
          {/* Table desktop */}
          <div className="hidden sm:block bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nom</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Rôle</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Créé le</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {u.full_name}
                      {u.must_change_password && (
                        <span className="ml-2 text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                          MDP à changer
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select value={u.role} onChange={e => changeRole(u, e.target.value)}
                        className="border border-gray-200 rounded px-2 py-1 text-xs">
                        <option value="vendeur">Vendeur</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {u.is_active ? 'Actif' : 'Désactivé'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(u.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => toggleActive(u)}
                        className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded px-2 py-1 hover:bg-gray-50">
                        {u.is_active ? 'Désactiver' : 'Activer'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards mobile */}
          <div className="sm:hidden flex flex-col gap-3">
            {users.map(u => (
              <div key={u.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900">{u.full_name}</p>
                    {u.username && <p className="text-xs text-gray-400 mt-0.5">@{u.username}</p>}
                    {u.must_change_password && (
                      <span className="inline-block mt-1 text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                        MDP à changer
                      </span>
                    )}
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {u.is_active ? 'Actif' : 'Désactivé'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <select value={u.role} onChange={e => changeRole(u, e.target.value)}
                      className="border border-gray-200 rounded px-2 py-1 text-xs">
                      <option value="vendeur">Vendeur</option>
                      <option value="admin">Admin</option>
                    </select>
                    <span className="text-xs text-gray-400">
                      {new Date(u.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <button onClick={() => toggleActive(u)}
                    className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded px-2 py-1 hover:bg-gray-50 shrink-0">
                    {u.is_active ? 'Désactiver' : 'Activer'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}