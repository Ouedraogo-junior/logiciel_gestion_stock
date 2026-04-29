import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'

export default async function PublicHome() {
  const supabase = await createClient()
  const { data: shop } = await supabase
    .from('shop_settings')
    .select('name, logo_url, phone, email, address, description')
    .single()

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {shop?.logo_url && (
            <Image
              src={shop.logo_url}
              alt="logo"
              width={72}
              height={72}
              className="mx-auto mb-6 rounded-2xl object-contain bg-white/10 p-2"
            />
          )}
          <h1 className="text-3xl md:text-5xl font-bold mb-4">{shop?.name ?? 'Bienvenue'}</h1>
          {shop?.description && (
            <p className="text-blue-100 text-lg max-w-xl mx-auto mb-8">{shop.description}</p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/catalogue"
              className="bg-white text-blue-700 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition">
              Voir le catalogue
            </Link>
            <Link href="/contact"
              className="border border-white/40 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition">
              Nous contacter
            </Link>
          </div>
        </div>
      </section>

      {/* Infos boutique */}
      <section className="max-w-4xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        {shop?.phone && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
            <div className="text-3xl mb-3">📞</div>
            <p className="font-semibold text-gray-900 mb-1">Téléphone</p>
            <p className="text-gray-500 text-sm">{shop.phone}</p>
          </div>
        )}
        {shop?.email && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
            <div className="text-3xl mb-3">✉️</div>
            <p className="font-semibold text-gray-900 mb-1">Email</p>
            <p className="text-gray-500 text-sm">{shop.email}</p>
          </div>
        )}
        {shop?.address && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
            <div className="text-3xl mb-3">📍</div>
            <p className="font-semibold text-gray-900 mb-1">Adresse</p>
            <p className="text-gray-500 text-sm">{shop.address}</p>
          </div>
        )}
      </section>
    </div>
  )
}