'use client'
import { useEffect } from 'react'
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
      />
    )
  })

  function handlePrint() {
    if (!instance.url) return
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    iframe.src = instance.url
    document.body.appendChild(iframe)
    iframe.onload = () => {
      iframe.contentWindow?.print()
      setTimeout(() => document.body.removeChild(iframe), 1000)
    }
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

        <button
          onClick={handlePrint}
          disabled={instance.loading || !!instance.error}
          className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 mb-2"
        >
          🖨 Imprimer le reçu
        </button>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl text-sm border border-gray-300 hover:bg-gray-50"
        >
          Fermer
        </button>
      </div>
    </div>
  )
}