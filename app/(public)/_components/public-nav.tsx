'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

type Shop = { name: string | null; logo_url: string | null; phone: string | null; email: string | null; address: string | null } | null

export default function PublicNav({ shop }: { shop: Shop }) {
  const [open, setOpen] = useState(false)

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo + Nom */}
        <Link href="/" className="flex items-center gap-3">
          {shop?.logo_url ? (
            <Image src={shop.logo_url} alt="logo" width={36} height={36} className="rounded-lg object-contain" />
          ) : (
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              {shop?.name?.[0] ?? 'B'}
            </div>
          )}
          <span className="font-semibold text-gray-900 text-sm">{shop?.name ?? 'Boutique'}</span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/" className="text-gray-600 hover:text-blue-600 transition">Accueil</Link>
          <Link href="/catalogue" className="text-gray-600 hover:text-blue-600 transition">Catalogue</Link>
          <Link href="/contact" className="text-gray-600 hover:text-blue-600 transition">Contact</Link>
        </nav>

        {/* Burger mobile */}
        <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
          <div className="w-5 h-0.5 bg-gray-700 mb-1" />
          <div className="w-5 h-0.5 bg-gray-700 mb-1" />
          <div className="w-5 h-0.5 bg-gray-700" />
        </button>
      </div>

      {/* Menu mobile */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-3 text-sm">
          <Link href="/" onClick={() => setOpen(false)} className="text-gray-700 hover:text-blue-600">Accueil</Link>
          <Link href="/catalogue" onClick={() => setOpen(false)} className="text-gray-700 hover:text-blue-600">Catalogue</Link>
          <Link href="/contact" onClick={() => setOpen(false)} className="text-gray-700 hover:text-blue-600">Contact</Link>
        </div>
      )}
    </header>
  )
}