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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      licenses: {
        Row: {
          created_at: string
          current_usage: number
          expires_at: string | null
          features: Json
          id: string
          license_key: string
          license_type: Database["public"]["Enums"]["license_type"]
          max_usage: number | null
          metadata: Json | null
          payment_id: string | null
          status: Database["public"]["Enums"]["license_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_usage?: number
          expires_at?: string | null
          features?: Json
          id?: string
          license_key: string
          license_type?: Database["public"]["Enums"]["license_type"]
          max_usage?: number | null
          metadata?: Json | null
          payment_id?: string | null
          status?: Database["public"]["Enums"]["license_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_usage?: number
          expires_at?: string | null
          features?: Json
          id?: string
          license_key?: string
          license_type?: Database["public"]["Enums"]["license_type"]
          max_usage?: number | null
          metadata?: Json | null
          payment_id?: string | null
          status?: Database["public"]["Enums"]["license_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_logs: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string | null
          id: string
          payload: Json
          signature: string | null
          status: string
          tx_ref: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type?: string | null
          id?: string
          payload: Json
          signature?: string | null
          status: string
          tx_ref?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string | null
          id?: string
          payload?: Json
          signature?: string | null
          status?: string
          tx_ref?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number | null
          created_at: string
          currency: string
          flw_id: string | null
          id: string
          metadata: Json | null
          plan: Database["public"]["Enums"]["plan_type"]
          status: Database["public"]["Enums"]["payment_status"]
          tx_ref: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string
          flw_id?: string | null
          id?: string
          metadata?: Json | null
          plan: Database["public"]["Enums"]["plan_type"]
          status?: Database["public"]["Enums"]["payment_status"]
          tx_ref: string
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string
          flw_id?: string | null
          id?: string
          metadata?: Json | null
          plan?: Database["public"]["Enums"]["plan_type"]
          status?: Database["public"]["Enums"]["payment_status"]
          tx_ref?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string
          full_name: string | null
          id: string
          monthly_usage: number | null
          payment_method: string | null
          subscription_expires_at: string | null
          subscription_status: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          monthly_usage?: number | null
          payment_method?: string | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          monthly_usage?: number | null
          payment_method?: string | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sources: {
        Row: {
          content_snippet: string | null
          created_at: string
          id: string
          reliability_score: number | null
          title: string | null
          url: string
          verification_id: string
        }
        Insert: {
          content_snippet?: string | null
          created_at?: string
          id?: string
          reliability_score?: number | null
          title?: string | null
          url: string
          verification_id: string
        }
        Update: {
          content_snippet?: string | null
          created_at?: string
          id?: string
          reliability_score?: number | null
          title?: string | null
          url?: string
          verification_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sources_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          monthly_usage: number | null
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          monthly_usage?: number | null
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          monthly_usage?: number | null
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          active: boolean
          auto_renew: boolean
          created_at: string
          end_date: string | null
          id: string
          last_payment_id: string | null
          plan: Database["public"]["Enums"]["plan_type"]
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          auto_renew?: boolean
          created_at?: string
          end_date?: string | null
          id?: string
          last_payment_id?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
          start_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          auto_renew?: boolean
          created_at?: string
          end_date?: string | null
          id?: string
          last_payment_id?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_last_payment_id_fkey"
            columns: ["last_payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_logs: {
        Row: {
          created_at: string
          details: Json | null
          id: string
          status: string
          step: string
          verification_id: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          id?: string
          status: string
          step: string
          verification_id: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          id?: string
          status?: string
          step?: string
          verification_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_logs_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      verifications: {
        Row: {
          content: string
          content_type: string
          created_at: string
          file_name: string | null
          file_size: number | null
          id: string
          processing_time_ms: number | null
          result_summary: string | null
          status: string
          trust_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          content_type: string
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          id?: string
          processing_time_ms?: number | null
          result_summary?: string | null
          status?: string
          trust_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          content_type?: string
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          id?: string
          processing_time_ms?: number | null
          result_summary?: string | null
          status?: string
          trust_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      payment_logs_safe: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_type: string | null
          id: string | null
          payload_summary: Json | null
          status: string | null
          tx_ref: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: never
          event_type?: string | null
          id?: string | null
          payload_summary?: never
          status?: string | null
          tx_ref?: never
        }
        Update: {
          created_at?: string | null
          error_message?: never
          event_type?: string | null
          id?: string | null
          payload_summary?: never
          status?: string | null
          tx_ref?: never
        }
        Relationships: []
      }
    }
    Functions: {
      can_access_payment_logs: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_feature_access: {
        Args: { feature_name: string; user_uuid: string }
        Returns: boolean
      }
      clear_user_verifications: {
        Args: { user_uuid: string }
        Returns: Json
      }
      create_trial_license: {
        Args: { user_uuid: string }
        Returns: Json
      }
      generate_license_key: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_subscription: {
        Args: { user_uuid: string }
        Returns: {
          active: boolean
          auto_renew: boolean
          days_remaining: number
          end_date: string
          plan: Database["public"]["Enums"]["plan_type"]
        }[]
      }
      handle_failed_payment: {
        Args: { failure_reason?: string; payment_id: string; user_uuid: string }
        Returns: boolean
      }
      handle_successful_payment: {
        Args: {
          payment_amount: number
          payment_id: string
          plan_name: Database["public"]["Enums"]["plan_type"]
          user_uuid: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_license_usage: {
        Args: { amount?: number; user_uuid: string }
        Returns: Json
      }
      upgrade_user_subscription: {
        Args: {
          expires_date?: string
          payment_uuid: string
          plan: string
          user_uuid: string
        }
        Returns: boolean
      }
      validate_license: {
        Args: { user_uuid: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
      license_status: "active" | "expired" | "suspended" | "revoked"
      license_type: "trial" | "basic" | "professional" | "enterprise"
      payment_status: "pending" | "successful" | "failed"
      plan_type: "free" | "pro" | "enterprise"
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
    Enums: {
      app_role: ["admin", "user"],
      license_status: ["active", "expired", "suspended", "revoked"],
      license_type: ["trial", "basic", "professional", "enterprise"],
      payment_status: ["pending", "successful", "failed"],
      plan_type: ["free", "pro", "enterprise"],
    },
  },
} as const
