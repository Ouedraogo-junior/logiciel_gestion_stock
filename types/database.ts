export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_value: Json | null
          old_value: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      bons: {
        Row: {
          advance_paid: number
          balance_due: number | null
          bon_number: string
          bon_type: string
          converted_to_order_id: string | null
          created_at: string | null
          created_by: string | null
          customer_name: string
          customer_phone: string | null
          id: string
          items: Json
          notes: string | null
          status: string
          total_amount: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          advance_paid?: number
          balance_due?: number | null
          bon_number: string
          bon_type: string
          converted_to_order_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_name: string
          customer_phone?: string | null
          id?: string
          items?: Json
          notes?: string | null
          status?: string
          total_amount?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          advance_paid?: number
          balance_due?: number | null
          bon_number?: string
          bon_type?: string
          converted_to_order_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_name?: string
          customer_phone?: string | null
          id?: string
          items?: Json
          notes?: string | null
          status?: string
          total_amount?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          discount: number
          id: string
          order_id: string
          quantity: number
          subtotal: number | null
          unit_price: number
          variant_id: string
        }
        Insert: {
          discount?: number
          id?: string
          order_id: string
          quantity: number
          subtotal?: number | null
          unit_price: number
          variant_id: string
        }
        Update: {
          discount?: number
          id?: string
          order_id?: string
          quantity?: number
          subtotal?: number | null
          unit_price?: number
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_active_debts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "v_public_catalogue"
            referencedColumns: ["variant_id"]
          },
        ]
      }
      orders: {
        Row: {
          amount_paid: number
          balance_due: number | null
          bon_id: string | null
          created_at: string | null
          created_by: string | null
          customer_name: string
          customer_phone: string | null
          id: string
          notes: string | null
          order_number: string
          status: string
          total_amount: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          amount_paid?: number
          balance_due?: number | null
          bon_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_name: string
          customer_phone?: string | null
          id?: string
          notes?: string | null
          order_number: string
          status?: string
          total_amount?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          amount_paid?: number
          balance_due?: number | null
          bon_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_name?: string
          customer_phone?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          status?: string
          total_amount?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_bon_id_fkey"
            columns: ["bon_id"]
            isOneToOne: false
            referencedRelation: "bons"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          alert_threshold: number
          buy_price: number
          color: string | null
          condition: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_archived: boolean | null
          product_id: string
          sell_price: number
          sku: string
          stock_qty: number
          storage: string | null
        }
        Insert: {
          alert_threshold?: number
          buy_price?: number
          color?: string | null
          condition?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_archived?: boolean | null
          product_id: string
          sell_price?: number
          sku?: string
          stock_qty?: number
          storage?: string | null
        }
        Update: {
          alert_threshold?: number
          buy_price?: number
          color?: string | null
          condition?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_archived?: boolean | null
          product_id?: string
          sell_price?: number
          sku?: string
          stock_qty?: number
          storage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_public_catalogue"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_archived: boolean | null
          is_public: boolean | null
          name: string
        }
        Insert: {
          brand?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean | null
          is_public?: boolean | null
          name: string
        }
        Update: {
          brand?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean | null
          is_public?: boolean | null
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          created_by: string | null
          full_name: string
          id: string
          is_active: boolean | null
          must_change_password: boolean | null
          role: string
          username: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          full_name: string
          id: string
          is_active?: boolean | null
          must_change_password?: boolean | null
          role?: string
          username?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          must_change_password?: boolean | null
          role?: string
          username?: string | null
        }
        Relationships: []
      }
      receipts: {
        Row: {
          generated_at: string | null
          generated_by: string | null
          id: string
          order_id: string
          pdf_url: string | null
          receipt_number: string
          stamp_applied_at: string | null
          stamp_applied_by: string | null
          stamp_type: string
        }
        Insert: {
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          order_id: string
          pdf_url?: string | null
          receipt_number: string
          stamp_applied_at?: string | null
          stamp_applied_by?: string | null
          stamp_type?: string
        }
        Update: {
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          order_id?: string
          pdf_url?: string | null
          receipt_number?: string
          stamp_applied_at?: string | null
          stamp_applied_by?: string | null
          stamp_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_active_debts"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_settings: {
        Row: {
          address: string | null
          description: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          note: string | null
          quantity: number
          reason: string | null
          reference_id: string | null
          type: string
          variant_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          note?: string | null
          quantity: number
          reason?: string | null
          reference_id?: string | null
          type: string
          variant_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          note?: string | null
          quantity?: number
          reason?: string | null
          reference_id?: string | null
          type?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "v_public_catalogue"
            referencedColumns: ["variant_id"]
          },
        ]
      }
    }
    Views: {
      v_active_debts: {
        Row: {
          amount_paid: number | null
          balance_due: number | null
          created_at: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string | null
          order_number: string | null
          status: string | null
          total_amount: number | null
        }
        Insert: {
          amount_paid?: number | null
          balance_due?: number | null
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string | null
          order_number?: string | null
          status?: string | null
          total_amount?: number | null
        }
        Update: {
          amount_paid?: number | null
          balance_due?: number | null
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string | null
          order_number?: string | null
          status?: string | null
          total_amount?: number | null
        }
        Relationships: []
      }
      v_daily_revenue: {
        Row: {
          day: string | null
          order_count: number | null
          revenue: number | null
        }
        Relationships: []
      }
      v_low_stock: {
        Row: {
          alert_threshold: number | null
          brand: string | null
          color: string | null
          condition: string | null
          product_name: string | null
          sku: string | null
          stock_qty: number | null
          storage: string | null
        }
        Relationships: []
      }
      v_public_catalogue: {
        Row: {
          brand: string | null
          category: string | null
          color: string | null
          condition: string | null
          description: string | null
          id: string | null
          name: string | null
          sell_price: number | null
          sku: string | null
          stock_qty: number | null
          storage: string | null
          variant_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_my_role: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
