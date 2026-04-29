'use client'
import { useState } from 'react'

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', phone: '', message: '' })
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // TODO: brancher envoi email (Resend ou autre)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
        <p className="text-3xl mb-3">✅</p>
        <p className="font-semibold text-green-800">Message envoyé !</p>
        <p className="text-sm text-green-600 mt-1">Nous vous répondrons dans les plus brefs délais.</p>
        <button onClick={() => { setSent(false); setForm({ name: '', phone: '', message: '' }) }}
          className="mt-4 text-sm text-green-700 hover:underline">
          Envoyer un autre message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
      <div>
        <label className="text-xs font-medium text-gray-600">Nom *</label>
        <input required value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Votre nom"
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600">Téléphone</label>
        <input value={form.phone}
          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
          placeholder="Votre numéro"
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600">Message *</label>
        <textarea required value={form.message}
          onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          placeholder="Votre message..."
          rows={5}
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>
      <button type="submit"
        className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition text-sm">
        Envoyer le message
      </button>
    </form>
  )
}