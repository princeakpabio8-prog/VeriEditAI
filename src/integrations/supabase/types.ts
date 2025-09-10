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
      profiles: {
        Row: {
          company: string | null
          created_at: string
          full_name: string | null
          id: string
          monthly_usage: number | null
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
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    },
  },
} as const
