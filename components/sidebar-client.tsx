'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

type Profile = {
  full_name: string
  role: 'admin' | 'vendeur'
  username: string | null
}

const navItems = [
  { href: '/dashboard', label: 'Tableau de bord', icon: '📊' },
  { href: '/products',  label: 'Produits',         icon: '📦' },
  { href: '/stock',     label: 'Stock',             icon: '🏪' },
  { href: '/orders',    label: 'Ventes',            icon: '🧾' },
  { href: '/debts',     label: 'Dettes',            icon: '💸' },
  { href: '/receipts',  label: 'Reçus',             icon: '🖨️' },
]

const adminItems = [
  { href: '/stats',          label: 'Statistiques', icon: '📊' },
  { href: '/settings/shop',  label: 'Boutique',     icon: '🏪' },
  { href: '/settings/users', label: 'Utilisateurs', icon: '👥' },
]


// Déclarer HORS du composant SidebarClient
function SidebarContent({
  shopName, logoUrl, profile, pathname, navigate, handleLogout, setOpen
}: {
  shopName: string
  logoUrl: string | null
  profile: Profile | null
  pathname: string
  navigate: (href: string) => void
  handleLogout: () => void
  setOpen: (v: boolean) => void
}) {
  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <Image src={logoUrl} alt="Logo" width={32} height={32} className="rounded-lg object-contain" />
          ) : (
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              {shopName[0]}
            </div>
          )}
          <div>
            <p className="text-white font-bold text-sm tracking-tight truncate max-w-32">{shopName}</p>
            <p className="text-gray-400 text-xs">Back-office</p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="md:hidden text-gray-400 hover:text-white p-1">✕</button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(item => (
          <button key={item.href} onClick={() => navigate(item.href)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
              isActive(item.href) ? 'bg-blue-600 text-white font-medium' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}>
            <span className="text-base leading-none w-5 text-center">{item.icon}</span>
            {item.label}
          </button>
        ))}

        {profile?.role === 'admin' && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Admin</p>
            </div>
            {adminItems.map(item => (
              <button key={item.href} onClick={() => navigate(item.href)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                  isActive(item.href) ? 'bg-blue-600 text-white font-medium' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}>
                <span className="text-base leading-none w-5 text-center">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </>
        )}
      </nav>

      {/* Profil + Logout */}
      <div className="px-3 py-4 border-t border-gray-800">
        <div className="px-3 py-2 mb-1">
          <p className="text-white text-sm font-medium truncate">{profile?.full_name}</p>
          <p className="text-gray-500 text-xs">@{profile?.username} · {profile?.role}</p>
        </div>
        <button onClick={() => navigate('/settings/account')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
            isActive('/settings/account') ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          }`}>
          <span className="w-5 text-center">⚙️</span>
          Mon compte
        </button>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-950 hover:text-red-300 transition-colors text-left">
          <span className="w-5 text-center">⎋</span>
          Se déconnecter
        </button>
      </div>
    </div>
  )
}

export default function SidebarClient({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [shopName, setShopName] = useState('GestionBoutique')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetch('/api/settings/shop')
      .then(r => r.json())
      .then(data => {
        if (data.name) setShopName(data.name)
        if (data.logo_url) setLogoUrl(data.logo_url)
      })
  }, [])

  useEffect(() => { setOpen(false) }, [pathname])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function navigate(href: string) {
    router.push(href)
    setOpen(false)
  }

   const contentProps = { shopName, logoUrl, profile, pathname, navigate, handleLogout, setOpen }

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex w-56 h-full bg-gray-900 flex-col shrink-0">
        <SidebarContent {...contentProps} />
      </aside>

      {/* Mobile — topbar + drawer */}
      <div className="md:hidden">
        {/* Topbar mobile */}
        <div className="fixed top-0 left-0 right-0 z-40 bg-gray-900 border-b border-gray-800 h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            {logoUrl ? (
              <Image src={logoUrl} alt="Logo" width={28} height={28} className="rounded-lg object-contain" />
            ) : (
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                {shopName[0]}
              </div>
            )}
            <span className="text-white font-bold text-sm">{shopName}</span>
          </div>
          <button onClick={() => setOpen(true)}
            className="text-gray-400 hover:text-white p-1 flex flex-col gap-1">
            <span className="block w-5 h-0.5 bg-current" />
            <span className="block w-5 h-0.5 bg-current" />
            <span className="block w-5 h-0.5 bg-current" />
          </button>
        </div>

        {/* Overlay */}
        {open && (
          <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setOpen(false)} />
        )}

        {/* Drawer */}
        <aside className={`fixed top-0 left-0 h-full w-64 z-50 bg-gray-900 transform transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <SidebarContent {...contentProps} />
        </aside>
      </div>
    </>
  )
}