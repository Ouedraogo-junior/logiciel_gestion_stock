'use client'
import { useState } from 'react'
import { usePDF } from '@react-pdf/renderer'
import { ReceiptDocument } from '@/lib/receipt-pdf'

type ShopSettings = {
  name: string
  phone: string | null
  email: string | null
  address: string | null
  logo_url: string | null
}

type OrderItem = {
  id: string
  quantity: number
  unit_price: number
  discount: number
  subtotal: number
  product_variants: {
    sku: string
    color: string | null
    storage: string | null
    products: { name: string } | null
  } | null
}

type Order = {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string | null
  status: 'PAID' | 'DELIVERED' | 'DEBT'
  total_amount: number
  amount_paid: number
  balance_due: number
  created_at: string
  order_items: OrderItem[]
}

type Props = {
  order: Order
  shop: ShopSettings
  receipt_number: string
  stamp_type: 'PAID' | 'DELIVERED' | 'NONE'
  seller_name: string | null
  onClose: () => void
}



export default function ReceiptModal({ order, shop, receipt_number, stamp_type, seller_name, onClose }: Props) {

  const [instance] = usePDF({
    document: (
      <ReceiptDocument
        order={order}
        receipt_number={receipt_number}
        stamp_type={stamp_type}
        shop={shop}
        seller_name={seller_name}
        format="A4_double"
      />
    )
  })

  const [closing, setClosing] = useState(false)

  function handleClose() {
  setClosing(true)
  onClose()
}

  function handlePrint() {
    if (!instance.url) return
    // Ouvre le PDF dans un nouvel onglet → l'utilisateur imprime depuis le viewer natif
    window.open(instance.url, '_blank')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Reçu de vente</h2>
        <p className="text-sm text-gray-500 mb-5">Commande {order.order_number}</p>

        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5 text-center">
          <p className="text-green-700 font-medium text-sm">✓ Vente enregistrée</p>
          <p className="text-green-600 text-xs mt-1">{receipt_number}</p>
        </div>

        {instance.loading && (
          <p className="text-sm text-gray-400 text-center mb-4">Préparation du reçu...</p>
        )}
        {instance.error && (
          <p className="text-sm text-red-600 text-center mb-4">Erreur PDF : {instance.error}</p>
        )}

        {/* Bouton principal : ouvre le PDF dans un nouvel onglet pour impression */}
        <button
          onClick={handlePrint}
          disabled={instance.loading || !!instance.error || !instance.url}
          className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 mb-2"
        >
          🖨 Ouvrir et imprimer le reçu
        </button>

        {/* Bouton secondaire : téléchargement direct */}
        {instance.url && (
          <a
            href={instance.url}
            download={`${receipt_number}.pdf`}
            className="block w-full text-center py-2.5 rounded-xl text-sm border border-gray-300 hover:bg-gray-50 mb-2"
          >
            ⬇ Télécharger le PDF
          </a>
        )}

        <button
          onClick={handleClose}
          disabled={closing}
          className="w-full py-2.5 rounded-xl text-sm border border-gray-300 hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {closing && (
            <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          )}
          Fermer
        </button>
      </div>
    </div>
  )
}