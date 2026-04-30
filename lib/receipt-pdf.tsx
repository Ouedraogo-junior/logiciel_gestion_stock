import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  pageA5: { padding: 24, fontSize: 9, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  pageA4: { padding: 14, fontSize: 8, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginBottom: 16, borderBottom: '1pt solid #e5e7eb', paddingBottom: 12,
  },
  shopName: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#111827' },
  shopInfo: { fontSize: 8, color: '#6b7280', marginTop: 2 },
  receiptTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#1d4ed8', textAlign: 'right' },
  receiptNumber: { fontSize: 8, color: '#6b7280', textAlign: 'right', marginTop: 2 },
  section: { marginBottom: 10 },
  sectionTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  label: { color: '#6b7280' },
  value: { fontFamily: 'Helvetica-Bold', color: '#111827' },
  table: { marginBottom: 10 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f9fafb', padding: '4 6', borderRadius: 2, marginBottom: 2 },
  tableRow: { flexDirection: 'row', padding: '3 6', borderBottom: '0.5pt solid #f3f4f6' },
  col1: { flex: 3 },
  col2: { flex: 1, textAlign: 'center' },
  col3: { flex: 1, textAlign: 'right' },
  col4: { flex: 1, textAlign: 'right' },
  tableHeaderText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#6b7280' },
  tableCell: { fontSize: 8, color: '#374151' },
  totalSection: { borderTop: '1pt solid #e5e7eb', paddingTop: 8, marginTop: 4 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  totalLabel: { fontSize: 9, color: '#6b7280' },
  totalValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#111827' },
  grandTotal: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#111827' },
  balanceValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#dc2626' },
  stampWrapper: {
    alignItems: 'flex-end',
    marginTop: 10,
  },
  stamp: {
    width: 80,
    height: 80,
    borderRadius: 40,
    border: '3pt solid',
    alignItems: 'center',
    justifyContent: 'center',
    transform: 'rotate(-20deg)',
    opacity: 0.85,
  },
  stampPaid: { borderColor: '#16a34a' },
  stampDelivered: { borderColor: '#2563eb' },
  stampText: { fontSize: 10, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  stampTextPaid: { color: '#16a34a' },
  stampTextDelivered: { color: '#2563eb' },
  inlineFooter: {
    marginTop: 12, borderTop: '0.5pt solid #e5e7eb', paddingTop: 6,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  footerText: { fontSize: 7, color: '#9ca3af' },
  cutLine: {
    marginVertical: 6, borderBottom: '1pt dashed #9ca3af',
    alignItems: 'center', justifyContent: 'center',
  },
  cutLineText: {
    fontSize: 7, color: '#9ca3af', backgroundColor: '#ffffff',
    paddingHorizontal: 6, marginBottom: -5,
  },
})

// ─── Types ────────────────────────────────────────────────────────────────────

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

type ContentProps = {
  order: Order
  receipt_number: string
  stamp_type: 'PAID' | 'DELIVERED' | 'NONE'
  shop: ShopSettings
  seller_name: string | null
}

// ─── Contenu réutilisable ─────────────────────────────────────────────────────

function ReceiptContent({ order, receipt_number, stamp_type, shop, seller_name, compact = false }: ContentProps & { compact?: boolean }) {
  const s = compact ? {
  header: { ...styles.header, marginBottom: 4, paddingBottom: 4 },
  section: { marginBottom: 3 },
  table: { marginBottom: 3 },
  totalSection: { ...styles.totalSection, paddingTop: 3, marginTop: 2 },
  inlineFooter: { ...styles.inlineFooter, marginTop: 4, paddingTop: 3 },
  shopName: { ...styles.shopName, fontSize: 10 },
  sectionTitle: { ...styles.sectionTitle, marginBottom: 1 },
  totalRow: { ...styles.totalRow, marginBottom: 0 },
  stampWrapper: { ...styles.stampWrapper, marginTop: 3 },
  stamp: { ...styles.stamp, width: 50, height: 50, borderRadius: 25 },
  grandTotal: { ...styles.grandTotal, fontSize: 8 },
  garantie: { marginTop: 3, padding: '2 5', backgroundColor: '#f9fafb', borderRadius: 3, borderLeft: '2pt solid #d1d5db' },
} : {
    header: styles.header,
    section: styles.section,
    table: styles.table,
    totalSection: styles.totalSection,
    inlineFooter: styles.inlineFooter,
    shopName: styles.shopName,
    sectionTitle: styles.sectionTitle,
    totalRow: styles.totalRow,
    stampWrapper: styles.stampWrapper,
    stamp: styles.stamp,
    grandTotal: styles.grandTotal,
    garantie: { marginTop: 10, padding: '5 8', backgroundColor: '#f9fafb', borderRadius: 3, borderLeft: '2pt solid #d1d5db' },
  }

  return (
    <View>
      <View style={s.header}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          {shop.logo_url && (
            <Image src={shop.logo_url} style={{ width: compact ? 28 : 36, height: compact ? 28 : 36, borderRadius: 4, objectFit: 'contain' }} />
          )}
          <View>
            <Text style={s.shopName}>{shop.name}</Text>
            {shop.address && <Text style={styles.shopInfo}>{shop.address}</Text>}
            {shop.phone && <Text style={styles.shopInfo}>Tél : {shop.phone}</Text>}
            {shop.email && <Text style={styles.shopInfo}>{shop.email}</Text>}
          </View>
        </View>
        <View>
          <Text style={styles.receiptTitle}>REÇU DE VENTE</Text>
          <Text style={styles.receiptNumber}>{receipt_number}</Text>
          <Text style={styles.receiptNumber}>Cmd : {order.order_number}</Text>
          <Text style={styles.receiptNumber}>
            {new Date(order.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </Text>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Client</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Nom :</Text>
          <Text style={styles.value}>{order.customer_name}</Text>
        </View>
        {order.customer_phone && (
          <View style={styles.row}>
            <Text style={styles.label}>Téléphone :</Text>
            <Text style={styles.value}>{order.customer_phone}</Text>
          </View>
        )}
      </View>

      <View style={s.table}>
        <Text style={s.sectionTitle}>Articles</Text>
        <View style={compact ? { ...styles.tableHeader, padding: '2 4' } : styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.col1]}>Désignation</Text>
          <Text style={[styles.tableHeaderText, styles.col2]}>Qté</Text>
          <Text style={[styles.tableHeaderText, styles.col3]}>P.U</Text>
          <Text style={[styles.tableHeaderText, styles.col4]}>Total</Text>
        </View>
        {order.order_items.map(item => (
          <View key={item.id} style={compact ? { ...styles.tableRow, padding: '2 4' } : styles.tableRow}>
            <View style={styles.col1}>
              <Text style={styles.tableCell}>{item.product_variants?.products?.name ?? '—'}</Text>
              <Text style={[styles.tableCell, { color: '#9ca3af', fontSize: 7 }]}>
                {[item.product_variants?.storage, item.product_variants?.color, item.product_variants?.sku].filter(Boolean).join(' · ')}
              </Text>
            </View>
            <Text style={[styles.tableCell, styles.col2]}>{item.quantity}</Text>
            <Text style={[styles.tableCell, styles.col3]}>{item.unit_price.toLocaleString()}</Text>
            <Text style={[styles.tableCell, styles.col4]}>{item.subtotal.toLocaleString()}</Text>
          </View>
        ))}
      </View>

      <View style={s.totalSection}>
        <View style={s.totalRow}>
          <Text style={styles.totalLabel}>Sous-total</Text>
          <Text style={styles.totalValue}>{order.total_amount.toLocaleString()} FCFA</Text>
        </View>
        <View style={s.totalRow}>
          <Text style={s.grandTotal}>TOTAL</Text>
          <Text style={s.grandTotal}>{order.total_amount.toLocaleString()} FCFA</Text>
        </View>
        <View style={s.totalRow}>
          <Text style={styles.totalLabel}>Montant payé</Text>
          <Text style={[styles.totalValue, { color: '#16a34a' }]}>{order.amount_paid.toLocaleString()} FCFA</Text>
        </View>
        {order.amount_paid > order.total_amount && (
          <View style={s.totalRow}>
            <Text style={styles.totalLabel}>Monnaie rendue</Text>
            <Text style={[styles.totalValue, { color: '#16a34a' }]}>
              {(order.amount_paid - order.total_amount).toLocaleString()} FCFA
            </Text>
          </View>
        )}
        {order.balance_due > 0 && (
          <View style={s.totalRow}>
            <Text style={styles.totalLabel}>Reste à payer</Text>
            <Text style={styles.balanceValue}>{order.balance_due.toLocaleString()} FCFA</Text>
          </View>
        )}
      </View>

      <View style={s.garantie}>
        <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#374151', marginBottom: 2 }}>GARANTIE</Text>
        <Text style={{ fontSize: 7, color: '#6b7280' }}>
          Ce produit bénéficie d{"'"}une garantie de 5 jours à compter de la date d{"'"}achat.
          Tout retour ou échange doit être accompagné de ce reçu.
        </Text>
      </View>

      {(stamp_type === 'PAID' || stamp_type === 'DELIVERED') && (
        <View style={s.stampWrapper}>
          <View style={[s.stamp, stamp_type === 'PAID' ? styles.stampPaid : styles.stampDelivered]}>
            <Text style={[styles.stampText, stamp_type === 'PAID' ? styles.stampTextPaid : styles.stampTextDelivered]}>
              {stamp_type === 'PAID' ? 'PAYÉ' : 'LIVRÉ'}
            </Text>
          </View>
        </View>
      )}

      <View style={s.inlineFooter}>
        <Text style={styles.footerText}>Merci pour votre achat !</Text>
        <View style={{ alignItems: 'flex-end' }}>
          {seller_name && <Text style={styles.footerText}>Vendeur : {seller_name}</Text>}
          <Text style={styles.footerText}>{receipt_number}</Text>
        </View>
      </View>
    </View>
  )
}

// ─── Export principal ─────────────────────────────────────────────────────────

type Props = ContentProps & { format?: 'A5' | 'A4_double' }

export function ReceiptDocument({ format = 'A5', ...props }: Props) {
    if (format === 'A4_double') {
    return (
      <Document>
        <Page size="A4" style={styles.pageA4}>
          <ReceiptContent {...props} compact />
          <View style={styles.cutLine}>
            <Text style={styles.cutLineText}>✂  Découpez ici</Text>
          </View>
          <ReceiptContent {...props} compact />
        </Page>
      </Document>
    )
  }

  return (
    <Document>
      <Page size="A5" style={styles.pageA5}>
        <ReceiptContent {...props} />
      </Page>
    </Document>
  )
}