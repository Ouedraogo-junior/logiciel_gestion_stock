import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

// ─── Styles ───────────────────────────────────────────────────────────────────

const FOOTER_HEIGHT = 90   // hauteur estimée du bloc totaux + footerLeft
const INLINE_FOOTER_HEIGHT = 22 // hauteur de la bande "Merci / vendeur"
const BOTTOM_MARGIN = FOOTER_HEIGHT + INLINE_FOOTER_HEIGHT + 8 // espace réservé en bas

const styles = StyleSheet.create({
  page: {
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: BOTTOM_MARGIN,
    fontSize: 9,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },

  // ── En-tête ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderBottom: '1pt solid #e5e7eb',
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 4,
    objectFit: 'contain',
  },
  shopName: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  shopInfo: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 2,
  },
  shopPhone: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginTop: 3,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  receiptTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#1d4ed8',
    textAlign: 'right',
  },
  receiptMeta: {
    fontSize: 8,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 2,
  },

  // ── Client / Vendeur ──
  infoBlock: {
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  infoLabel: {
    fontSize: 8,
    color: '#6b7280',
    width: 55,
  },
  infoValue: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },

  // ── Tableau ──
  table: {
    borderTop: '1pt solid #000000',
    borderLeft: '1pt solid #000000',
    borderRight: '1pt solid #000000',
    marginBottom: 0,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: '1pt solid #000000',
    backgroundColor: '#f9fafb',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '0.5pt solid #cccccc',
    minHeight: 16,
  },
  tableRowEmpty: {
    flexDirection: 'row',
    borderBottom: '0.5pt solid #e5e7eb',
    height: 16,
  },

  colRef:     { width: '20%', borderRight: '0.5pt solid #cccccc', padding: '3 4' },
  colDesig:   { flex: 1,      borderRight: '0.5pt solid #cccccc', padding: '3 4' },
  colQty:     { width: '10%', borderRight: '0.5pt solid #cccccc', padding: '3 4', textAlign: 'center' },
  colPU:      { width: '14%', borderRight: '0.5pt solid #cccccc', padding: '3 4', textAlign: 'right' },
  colMontant: { width: '16%', padding: '3 4', textAlign: 'right' },

  headerText:     { fontSize: 8, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  cellText:       { fontSize: 8, color: '#374151' },
  cellTextRight:  { fontSize: 8, color: '#374151', textAlign: 'right' },
  cellTextCenter: { fontSize: 8, color: '#374151', textAlign: 'center' },
  cellSku:        { fontSize: 7, color: '#9ca3af', marginTop: 1 },

  // ── Pied FIXE (ancré en bas de chaque page) ──
  footer: {
    position: 'absolute',
    bottom: INLINE_FOOTER_HEIGHT + 10,
    left: 24,
    right: 24,
    flexDirection: 'row',
    borderTop: '1pt solid #000000',
    borderLeft: '1pt solid #000000',
    borderRight: '1pt solid #000000',
    borderBottom: '1pt solid #000000',
  },
  footerLeft: {
    flex: 1,
    padding: '6 8',
    borderRight: '1pt solid #000000',
    justifyContent: 'space-between',
  },
  footerShopName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  footerArretee: {
    fontSize: 7,
    fontFamily: 'Helvetica-Oblique',
    textDecoration: 'underline',
    marginBottom: 2,
    color: '#374151',
  },
  footerMontantLettre: {
    fontSize: 7,
    color: '#555555',
  },
  footerRight: {
    width: '38%',
  },

  // ── Totaux ──
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottom: '0.5pt solid #cccccc',
    padding: '3 8',
  },
  totalRowGrand: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottom: '0.5pt solid #cccccc',
    padding: '4 8',
    backgroundColor: '#f9fafb',
  },
  totalRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: '4 8',
    backgroundColor: '#f5f5f5',
  },
  totalLabel:      { fontSize: 8, color: '#6b7280' },
  totalLabelBold:  { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#111827' },
  totalValue:      { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#111827' },
  totalValueGreen: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#16a34a' },
  totalValueRed:   { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#dc2626' },
  totalValueGrand: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#111827' },

  // ── Bas de page FIXE ──
  inlineFooter: {
    position: 'absolute',
    bottom: 6,
    left: 24,
    right: 24,
    borderTop: '0.5pt solid #e5e7eb',
    paddingTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stampContainer: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  stampText: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    padding: 6,
    borderWidth: 1,
    borderRadius: 4,
  },
  footerText: { fontSize: 7, color: '#9ca3af' },
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

type Props = {
  order: Order
  receipt_number: string
  shop: ShopSettings
  seller_name: string | null
  stamp_type: 'PAID' | 'DELIVERED' | 'NONE'
  format?: string
}

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function formatMoney(n: number) {
  return n.toLocaleString('fr-FR') + ' F'
}

function numberToWords(n: number): string {
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
    'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf']
  const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt']

  if (n === 0) return 'zéro'

  function below1000(num: number): string {
    if (num === 0) return ''
    if (num < 20) return units[num]
    if (num < 100) {
      const t = Math.floor(num / 10)
      const u = num % 10
      if (t === 7) return 'soixante-' + units[10 + u]
      if (t === 9) return 'quatre-vingt-' + (u === 0 ? '' : units[u])
      return tens[t] + (u === 1 && t !== 8 ? '-et-un' : u > 0 ? '-' + units[u] : (t === 8 ? 's' : ''))
    }
    const h = Math.floor(num / 100)
    const rest = num % 100
    return (h === 1 ? 'cent' : units[h] + ' cent') + (rest === 0 && h > 1 ? 's' : rest > 0 ? ' ' + below1000(rest) : '')
  }

  let result = ''
  const millions  = Math.floor(n / 1_000_000)
  const thousands = Math.floor((n % 1_000_000) / 1000)
  const remainder = n % 1000

  if (millions  > 0) result += (millions  === 1 ? 'un million'  : below1000(millions)  + ' millions')  + ' '
  if (thousands > 0) result += (thousands === 1 ? 'mille'       : below1000(thousands) + ' mille')      + ' '
  if (remainder > 0) result += below1000(remainder)

  return result.trim().replace(/\s+/g, ' ')
}

const MIN_ROWS = 10

// ─── Composant ────────────────────────────────────────────────────────────────

export function ReceiptDocument({ order, receipt_number, shop, seller_name, stamp_type }: Props) {
  const date    = new Date(order.created_at)
  const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  const emptyRows = Math.max(0, MIN_ROWS - order.order_items.length)

  const solde = order.balance_due > 0 ? order.balance_due : order.total_amount
  const montantLettre = numberToWords(solde)
  const montantLettreCapitalized = montantLettre.charAt(0).toUpperCase() + montantLettre.slice(1) + ' FCFA'

  return (
    <Document>
      <Page size={[595.28, 420.94]} style={styles.page}>

        {/* ── En-tête ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {shop.logo_url && (
              <Image src={shop.logo_url} style={styles.logo} />
            )}
            <View>
              <Text style={styles.shopName}>{shop.name}</Text>
              {shop.address && <Text style={styles.shopInfo}>{shop.address}</Text>}
              {shop.email   && <Text style={styles.shopInfo}>{shop.email}</Text>}
              {shop.phone   && <Text style={styles.shopPhone}>Tél : {shop.phone}</Text>}
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.receiptTitle}>FACTURE</Text>
            <Text style={styles.receiptMeta}>{receipt_number}</Text>
            <Text style={styles.receiptMeta}>Cmd : {order.order_number}</Text>
            <Text style={styles.receiptMeta}>{dateStr} à {timeStr}</Text>
            {stamp_type !== 'NONE' ? (
              <View style={styles.stampContainer}>
                <Text
                  style={[
                    styles.stampText,
                    { borderColor: stamp_type === 'PAID' ? '#16a34a' : '#2563eb', color: stamp_type === 'PAID' ? '#16a34a' : '#2563eb' },
                  ]}
                >
                  {stamp_type === 'PAID' ? 'Payé' : 'Livré'}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ── Client / Vendeur ── */}
        <View style={styles.infoBlock}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Client :</Text>
            <Text style={styles.infoValue}>{order.customer_name}</Text>
          </View>
          {order.customer_phone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Téléphone :</Text>
              <Text style={styles.infoValue}>{order.customer_phone}</Text>
            </View>
          )}
          {seller_name && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Vendeur :</Text>
              <Text style={styles.infoValue}>{seller_name}</Text>
            </View>
          )}
        </View>

        {/* ── Tableau articles ── */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.colRef}>
              <Text style={styles.headerText}>Référence</Text>
            </View>
            <View style={styles.colDesig}>
              <Text style={styles.headerText}>Désignation</Text>
            </View>
            <View style={styles.colQty}>
              <Text style={styles.headerText}>Qté</Text>
            </View>
            <View style={styles.colPU}>
              <Text style={styles.headerText}>Px unitaire</Text>
            </View>
            <View style={styles.colMontant}>
              <Text style={styles.headerText}>Montant</Text>
            </View>
          </View>

          {order.order_items.map(item => {
            const sku  = item.product_variants?.sku ?? ''
            const name = item.product_variants?.products?.name ?? '—'
            const meta = [item.product_variants?.storage, item.product_variants?.color]
              .filter(Boolean).join(' · ')
            return (
              <View key={item.id} style={styles.tableRow}>
                <View style={styles.colRef}>
                  <Text style={styles.cellText}>{sku}</Text>
                </View>
                <View style={styles.colDesig}>
                  <Text style={styles.cellText}>{name}</Text>
                  {meta ? <Text style={styles.cellSku}>{meta}</Text> : null}
                </View>
                <View style={styles.colQty}>
                  <Text style={styles.cellTextCenter}>{item.quantity}</Text>
                </View>
                <View style={styles.colPU}>
                  <Text style={styles.cellTextRight}>{item.unit_price.toLocaleString('fr-FR')}</Text>
                </View>
                <View style={styles.colMontant}>
                  <Text style={styles.cellTextRight}>{item.subtotal.toLocaleString('fr-FR')} F</Text>
                </View>
              </View>
            )
          })}

          {Array.from({ length: emptyRows }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.tableRowEmpty}>
              <View style={styles.colRef} />
              <View style={styles.colDesig} />
              <View style={styles.colQty} />
              <View style={styles.colPU} />
              <View style={styles.colMontant} />
            </View>
          ))}
        </View>

        {/* ── Pied FIXE — ancré en bas de chaque page ── */}
        <View style={styles.footer} fixed>
          <View style={styles.footerLeft}>
            <Text style={styles.footerShopName}>{shop.name.toUpperCase()}</Text>
            <View>
              <Text style={styles.footerArretee}>Arrêtée la présente facture à la somme de :</Text>
              <Text style={styles.footerMontantLettre}>{montantLettreCapitalized}</Text>
            </View>
          </View>

          <View style={styles.footerRight}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Sous-total</Text>
              <Text style={styles.totalValue}>{formatMoney(order.total_amount)}</Text>
            </View>
            <View style={styles.totalRowGrand}>
              <Text style={styles.totalLabelBold}>TOTAL</Text>
              <Text style={styles.totalValueGrand}>{formatMoney(order.total_amount)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Montant payé</Text>
              <Text style={styles.totalValueGreen}>{formatMoney(order.amount_paid)}</Text>
            </View>
            {order.amount_paid > order.total_amount && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Monnaie rendue</Text>
                <Text style={styles.totalValueGreen}>
                  {formatMoney(order.amount_paid - order.total_amount)}
                </Text>
              </View>
            )}
            {order.balance_due > 0 && (
              <View style={styles.totalRowLast}>
                <Text style={styles.totalLabelBold}>RESTE À PAYER</Text>
                <Text style={styles.totalValueRed}>{formatMoney(order.balance_due)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Bas de page FIXE ── */}
        <View style={styles.inlineFooter} fixed>
          <Text style={styles.footerText}>Merci pour votre achat !</Text>
          <View style={{ alignItems: 'flex-end' }}>
            {seller_name && <Text style={styles.footerText}>Vendeur : {seller_name}</Text>}
            <Text style={styles.footerText}>{receipt_number}</Text>
          </View>
        </View>

      </Page>
    </Document>
  )
}