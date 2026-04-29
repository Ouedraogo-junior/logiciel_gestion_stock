// types/database.ts
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type Database = {
  public: {
    Tables: {
      shop_settings: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          phone: string | null
          email: string | null
          address: string | null
          description: string | null
          updated_by: string | null
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['shop_settings']['Row'], 'id' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['shop_settings']['Insert']>
      }
      profiles: {
        Row: {
          id: string
          full_name: string
          username: string | null
          role: 'admin' | 'vendeur'
          must_change_password: boolean
          is_active: boolean
          created_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      products: {
        Row: {
          id: string
          name: string
          brand: string | null
          category: string | null
          description: string | null
          is_public: boolean
          is_archived: boolean
          created_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          sku: string
          storage: string | null
          color: string | null
          condition: 'Neuf' | 'Reconditionné' | 'Occasion' | null
          buy_price: number
          sell_price: number
          stock_qty: number
          alert_threshold: number
          is_archived: boolean
          created_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['product_variants']['Row'], 'id' | 'created_at' | 'stock_qty'>
        Update: Partial<Database['public']['Tables']['product_variants']['Insert']>
      }
      stock_movements: {
        Row: {
          id: string
          variant_id: string
          type: 'IN' | 'OUT'
          quantity: number
          reason: 'Achat' | 'Vente' | 'Retour' | 'Correction' | 'Perte' | null
          note: string | null
          reference_id: string | null
          created_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['stock_movements']['Row'], 'id' | 'created_at'>
        Update: never
      }
      orders: {
        Row: {
          id: string
          order_number: string
          customer_name: string
          customer_phone: string | null
          status: 'PAID' | 'DELIVERED' | 'DEBT'
          total_amount: number
          amount_paid: number
          balance_due: number
          bon_id: string | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_by: string | null
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'order_number' | 'balance_due' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          variant_id: string
          quantity: number
          unit_price: number
          discount: number
          subtotal: number
        }
        Insert: Omit<Database['public']['Tables']['order_items']['Row'], 'id' | 'subtotal'>
        Update: never
      }
      bons: {
        Row: {
          id: string
          bon_number: string
          bon_type: 'RESERVATION' | 'LIVRAISON' | 'COMMANDE'
          customer_name: string
          customer_phone: string | null
          items: Json
          total_amount: number
          advance_paid: number
          balance_due: number
          status: 'OPEN' | 'CONVERTED' | 'CANCELLED'
          converted_to_order_id: string | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_by: string | null
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['bons']['Row'], 'id' | 'bon_number' | 'balance_due' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['bons']['Insert']>
      }
      receipts: {
        Row: {
          id: string
          receipt_number: string
          order_id: string
          stamp_type: 'PAID' | 'DELIVERED' | 'NONE'
          stamp_applied_by: string | null
          stamp_applied_at: string | null
          generated_by: string | null
          generated_at: string
          pdf_url: string | null
        }
        Insert: Omit<Database['public']['Tables']['receipts']['Row'], 'id' | 'receipt_number' | 'generated_at'>
        Update: Partial<Database['public']['Tables']['receipts']['Insert']>
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: 'CREATE' | 'UPDATE' | 'DELETE' | 'PRINT' | 'STAMP'
          entity_type: string
          entity_id: string | null
          old_value: Json | null
          new_value: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: never
        Update: never
      }
    }
    Views: {
      v_low_stock: {
        Row: {
          product_name: string
          brand: string | null
          sku: string
          color: string | null
          storage: string | null
          condition: string | null
          stock_qty: number
          alert_threshold: number
        }
      }
      v_active_debts: {
        Row: {
          id: string
          order_number: string
          customer_name: string
          customer_phone: string | null
          status: 'DELIVERED' | 'DEBT'
          total_amount: number
          amount_paid: number
          balance_due: number
          created_at: string
        }
      }
      v_daily_revenue: {
        Row: {
          day: string
          revenue: number
          order_count: number
        }
      }
      v_public_catalogue: {
        Row: {
          id: string
          name: string
          brand: string | null
          category: string | null
          description: string | null
          variant_id: string
          sku: string
          storage: string | null
          color: string | null
          condition: string | null
          sell_price: number
          stock_qty: number
        }
      }
    }
  }
}

// Types raccourcis
export type ShopSettings   = Database['public']['Tables']['shop_settings']['Row']
export type Profile        = Database['public']['Tables']['profiles']['Row']
export type Product        = Database['public']['Tables']['products']['Row']
export type ProductVariant = Database['public']['Tables']['product_variants']['Row']
export type StockMovement  = Database['public']['Tables']['stock_movements']['Row']
export type Order          = Database['public']['Tables']['orders']['Row']
export type OrderItem      = Database['public']['Tables']['order_items']['Row']
export type Bon            = Database['public']['Tables']['bons']['Row']
export type Receipt        = Database['public']['Tables']['receipts']['Row']
export type AuditLog       = Database['public']['Tables']['audit_logs']['Row']