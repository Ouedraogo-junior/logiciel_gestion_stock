import ContactForm from './contact-form'
import { createClient } from '@/lib/supabase/server'

export default async function ContactPage() {
  const supabase = await createClient()
  const { data: shop } = await supabase
    .from('shop_settings')
    .select('name, phone, email, address')
    .single() as { data: { name: string | null; phone: string | null; email: string | null; address: string | null } | null }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Contactez-nous</h1>
        <p className="text-gray-500 text-sm">Nous sommes disponibles pour répondre à vos questions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Infos */}
        <div className="space-y-4">
          {shop?.phone && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-xs text-gray-400 mb-1">Téléphone</p>
              <p className="font-semibold text-gray-900">{shop.phone}</p>
            </div>
          )}
          {shop?.email && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-xs text-gray-400 mb-1">Email</p>
              <p className="font-semibold text-gray-900">{shop.email}</p>
            </div>
          )}
          {shop?.address && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-xs text-gray-400 mb-1">Adresse</p>
              <p className="font-semibold text-gray-900">{shop.address}</p>
            </div>
          )}
        </div>

        {/* Formulaire */}
        <ContactForm />
      </div>
    </div>
  )
}