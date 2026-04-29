type Shop = { name: string | null; phone: string | null; email: string | null; address: string | null } | null

export default function PublicFooter({ shop }: { shop: Shop }) {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
        <div>
          <p className="font-semibold text-gray-900 mb-2">{shop?.name ?? 'Boutique'}</p>
          <p className="text-xs text-gray-400">Téléphones & accessoires</p>
        </div>
        <div>
          <p className="font-semibold text-gray-900 mb-2">Contact</p>
          {shop?.phone && <p>{shop.phone}</p>}
          {shop?.email && <p>{shop.email}</p>}
        </div>
        <div>
          <p className="font-semibold text-gray-900 mb-2">Adresse</p>
          {shop?.address && <p>{shop.address}</p>}
        </div>
      </div>
      <div className="border-t border-gray-100 text-center py-4 text-xs text-gray-400">
        © {new Date().getFullYear()} {shop?.name ?? 'Boutique'} — Tous droits réservés
      </div>
    </footer>
  )
}