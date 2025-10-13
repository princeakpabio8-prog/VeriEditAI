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
      activity_stream: {
        Row: {
          activity_type: string
          click_count: number
          created_at: string | null
          entity_id: string | null
          id: string
          is_public: boolean
          metadata: Json | null
          share_count: number
          user_id: string | null
          view_count: number
        }
        Insert: {
          activity_type: string
          click_count?: number
          created_at?: string | null
          entity_id?: string | null
          id?: string
          is_public?: boolean
          metadata?: Json | null
          share_count?: number
          user_id?: string | null
          view_count?: number
        }
        Update: {
          activity_type?: string
          click_count?: number
          created_at?: string | null
          entity_id?: string | null
          id?: string
          is_public?: boolean
          metadata?: Json | null
          share_count?: number
          user_id?: string | null
          view_count?: number
        }
        Relationships: []
      }
      aggregation_logs: {
        Row: {
          created_at: string
          error_message: string | null
          execution_status: string
          execution_time_ms: number | null
          id: string
          metadata: Json | null
          records_processed: number | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          execution_status: string
          execution_time_ms?: number | null
          id?: string
          metadata?: Json | null
          records_processed?: number | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          execution_status?: string
          execution_time_ms?: number | null
          id?: string
          metadata?: Json | null
          records_processed?: number | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_preview: string
          last_used_at: string | null
          name: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_preview: string
          last_used_at?: string | null
          name?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_preview?: string
          last_used_at?: string | null
          name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      api_usage_logs: {
        Row: {
          api_key_hash: string
          created_at: string
          endpoint: string
          id: string
          metadata: Json | null
          status_code: number
        }
        Insert: {
          api_key_hash: string
          created_at?: string
          endpoint: string
          id?: string
          metadata?: Json | null
          status_code: number
        }
        Update: {
          api_key_hash?: string
          created_at?: string
          endpoint?: string
          id?: string
          metadata?: Json | null
          status_code?: number
        }
        Relationships: []
      }
      embedding_cache: {
        Row: {
          access_count: number | null
          content_hash: string
          created_at: string | null
          embedding: string
          id: string
          last_accessed_at: string | null
        }
        Insert: {
          access_count?: number | null
          content_hash: string
          created_at?: string | null
          embedding: string
          id?: string
          last_accessed_at?: string | null
        }
        Update: {
          access_count?: number | null
          content_hash?: string
          created_at?: string | null
          embedding?: string
          id?: string
          last_accessed_at?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          category: string | null
          created_at: string
          id: string
          message: string
          metadata: Json | null
          rating: number | null
          type: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          rating?: number | null
          type: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          rating?: number | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      fraud_patterns: {
        Row: {
          category: string
          content: string
          created_at: string | null
          embedding: string
          id: string
          metadata: Json | null
          severity: string | null
          source: string | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          embedding: string
          id?: string
          metadata?: Json | null
          severity?: string | null
          source?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          embedding?: string
          id?: string
          metadata?: Json | null
          severity?: string | null
          source?: string | null
        }
        Relationships: []
      }
      grant_applications: {
        Row: {
          created_at: string | null
          email_notifications_enabled: boolean | null
          funding_amount: number | null
          grant_type: string | null
          id: string
          metadata: Json | null
          organization_name: string | null
          status: string | null
          submission_deadline: string | null
          updated_at: string | null
          user_id: string
          verification_id: string | null
        }
        Insert: {
          created_at?: string | null
          email_notifications_enabled?: boolean | null
          funding_amount?: number | null
          grant_type?: string | null
          id?: string
          metadata?: Json | null
          organization_name?: string | null
          status?: string | null
          submission_deadline?: string | null
          updated_at?: string | null
          user_id: string
          verification_id?: string | null
        }
        Update: {
          created_at?: string | null
          email_notifications_enabled?: boolean | null
          funding_amount?: number | null
          grant_type?: string | null
          id?: string
          metadata?: Json | null
          organization_name?: string | null
          status?: string | null
          submission_deadline?: string | null
          updated_at?: string | null
          user_id?: string
          verification_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grant_applications_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      image_verifications: {
        Row: {
          content_analysis: Json | null
          created_at: string
          id: string
          image_url: string | null
          labels: Json | null
          ocr_text: string | null
          safe_search: Json | null
          updated_at: string
          verification_id: string
        }
        Insert: {
          content_analysis?: Json | null
          created_at?: string
          id?: string
          image_url?: string | null
          labels?: Json | null
          ocr_text?: string | null
          safe_search?: Json | null
          updated_at?: string
          verification_id: string
        }
        Update: {
          content_analysis?: Json | null
          created_at?: string
          id?: string
          image_url?: string | null
          labels?: Json | null
          ocr_text?: string | null
          safe_search?: Json | null
          updated_at?: string
          verification_id?: string
        }
        Relationships: []
      }
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
      lighthouse_rooms: {
        Row: {
          category: Database["public"]["Enums"]["room_category"]
          created_at: string
          creator_id: string | null
          description: string | null
          id: string
          is_active: boolean
          member_count: number
          metadata: Json | null
          name: string
          room_type: Database["public"]["Enums"]["room_type"]
          thread_count: number
          trust_rating: number | null
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["room_category"]
          created_at?: string
          creator_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          member_count?: number
          metadata?: Json | null
          name: string
          room_type?: Database["public"]["Enums"]["room_type"]
          thread_count?: number
          trust_rating?: number | null
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["room_category"]
          created_at?: string
          creator_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          member_count?: number
          metadata?: Json | null
          name?: string
          room_type?: Database["public"]["Enums"]["room_type"]
          thread_count?: number
          trust_rating?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      news_feed: {
        Row: {
          category: string | null
          created_at: string | null
          fetched_at: string | null
          full_content: string | null
          id: string
          image_url: string | null
          is_verified: boolean | null
          link: string
          metadata: Json | null
          published_at: string
          source: string
          source_url: string
          summary: string | null
          title: string
          trust_score: number | null
          updated_at: string | null
          verification_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          fetched_at?: string | null
          full_content?: string | null
          id?: string
          image_url?: string | null
          is_verified?: boolean | null
          link: string
          metadata?: Json | null
          published_at: string
          source: string
          source_url: string
          summary?: string | null
          title: string
          trust_score?: number | null
          updated_at?: string | null
          verification_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          fetched_at?: string | null
          full_content?: string | null
          id?: string
          image_url?: string | null
          is_verified?: boolean | null
          link?: string
          metadata?: Json | null
          published_at?: string
          source?: string
          source_url?: string
          summary?: string | null
          title?: string
          trust_score?: number | null
          updated_at?: string | null
          verification_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_feed_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          related_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          related_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          related_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_claims: {
        Row: {
          claim_text: string
          confidence_level: string | null
          created_at: string | null
          discovered_at: string | null
          id: string
          metadata: Json | null
          organization_id: string
          published_at: string | null
          source_type: string
          source_url: string
          trust_score: number | null
          verification_id: string | null
          verification_status: string | null
        }
        Insert: {
          claim_text: string
          confidence_level?: string | null
          created_at?: string | null
          discovered_at?: string | null
          id?: string
          metadata?: Json | null
          organization_id: string
          published_at?: string | null
          source_type: string
          source_url: string
          trust_score?: number | null
          verification_id?: string | null
          verification_status?: string | null
        }
        Update: {
          claim_text?: string
          confidence_level?: string | null
          created_at?: string | null
          discovered_at?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          published_at?: string | null
          source_type?: string
          source_url?: string
          trust_score?: number | null
          verification_id?: string | null
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_claims_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_claims_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          avg_trust_score: number | null
          contact_email: string | null
          created_at: string | null
          description: string | null
          domain: string | null
          id: string
          industry: string
          logo_url: string | null
          metadata: Json | null
          name: string
          total_verifications: number | null
          updated_at: string | null
          verified_partner: boolean | null
          website: string | null
        }
        Insert: {
          avg_trust_score?: number | null
          contact_email?: string | null
          created_at?: string | null
          description?: string | null
          domain?: string | null
          id?: string
          industry: string
          logo_url?: string | null
          metadata?: Json | null
          name: string
          total_verifications?: number | null
          updated_at?: string | null
          verified_partner?: boolean | null
          website?: string | null
        }
        Update: {
          avg_trust_score?: number | null
          contact_email?: string | null
          created_at?: string | null
          description?: string | null
          domain?: string | null
          id?: string
          industry?: string
          logo_url?: string | null
          metadata?: Json | null
          name?: string
          total_verifications?: number | null
          updated_at?: string | null
          verified_partner?: boolean | null
          website?: string | null
        }
        Relationships: []
      }
      partnership_requests: {
        Row: {
          contact_email: string
          contact_name: string
          contact_website: string | null
          created_at: string | null
          id: string
          message: string | null
          organization_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          contact_email: string
          contact_name: string
          contact_website?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          organization_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          contact_email?: string
          contact_name?: string
          contact_website?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          organization_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partnership_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      profile_access_logs: {
        Row: {
          access_reason: string | null
          access_type: string
          accessed_at: string | null
          accessed_user_id: string
          accessor_user_id: string | null
          id: string
          ip_address: unknown | null
          user_agent: string | null
        }
        Insert: {
          access_reason?: string | null
          access_type: string
          accessed_at?: string | null
          accessed_user_id: string
          accessor_user_id?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Update: {
          access_reason?: string | null
          access_type?: string
          accessed_at?: string | null
          accessed_user_id?: string
          accessor_user_id?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_digest_enabled: boolean | null
          avatar_url: string | null
          badges: Json | null
          bonus_verifications: number | null
          company: string | null
          created_at: string
          email_preferences: Json | null
          followers_count: number | null
          following_count: number | null
          full_name: string | null
          id: string
          monthly_usage: number | null
          payment_method: string | null
          referral_code: string | null
          referred_by: string | null
          subscription_expires_at: string | null
          subscription_status: string | null
          subscription_tier: string | null
          total_referrals: number | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          activity_digest_enabled?: boolean | null
          avatar_url?: string | null
          badges?: Json | null
          bonus_verifications?: number | null
          company?: string | null
          created_at?: string
          email_preferences?: Json | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          id?: string
          monthly_usage?: number | null
          payment_method?: string | null
          referral_code?: string | null
          referred_by?: string | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          total_referrals?: number | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          activity_digest_enabled?: boolean | null
          avatar_url?: string | null
          badges?: Json | null
          bonus_verifications?: number | null
          company?: string | null
          created_at?: string
          email_preferences?: Json | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          id?: string
          monthly_usage?: number | null
          payment_method?: string | null
          referral_code?: string | null
          referred_by?: string | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          total_referrals?: number | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      public_engagement: {
        Row: {
          content_id: string
          content_type: string
          created_at: string | null
          event_type: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          platform: string | null
          user_agent: string | null
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          platform?: string | null
          user_agent?: string | null
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          platform?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      public_threads: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          og_description: string | null
          og_image_url: string | null
          og_title: string | null
          platform_stats: Json | null
          share_count: number
          share_token: string
          thread_id: string
          updated_at: string
          user_id: string
          view_count: number
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          platform_stats?: Json | null
          share_count?: number
          share_token: string
          thread_id: string
          updated_at?: string
          user_id: string
          view_count?: number
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          platform_stats?: Json | null
          share_count?: number
          share_token?: string
          thread_id?: string
          updated_at?: string
          user_id?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "public_threads_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "room_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      public_verifications: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          og_description: string | null
          og_image_url: string | null
          og_title: string | null
          platform_stats: Json | null
          share_count: number | null
          share_token: string
          updated_at: string
          user_id: string
          verification_id: string
          view_count: number
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          platform_stats?: Json | null
          share_count?: number | null
          share_token: string
          updated_at?: string
          user_id: string
          verification_id: string
          view_count?: number
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          platform_stats?: Json | null
          share_count?: number | null
          share_token?: string
          updated_at?: string
          user_id?: string
          verification_id?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "public_verifications_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          bonus_credits_awarded: number | null
          completed_at: string | null
          created_at: string | null
          id: string
          referral_code: string
          referred_email: string | null
          referred_user_id: string | null
          referrer_id: string
          signup_completed: boolean | null
          status: string | null
        }
        Insert: {
          bonus_credits_awarded?: number | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          referral_code: string
          referred_email?: string | null
          referred_user_id?: string | null
          referrer_id: string
          signup_completed?: boolean | null
          status?: string | null
        }
        Update: {
          bonus_credits_awarded?: number | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          referral_code?: string
          referred_email?: string | null
          referred_user_id?: string | null
          referrer_id?: string
          signup_completed?: boolean | null
          status?: string | null
        }
        Relationships: []
      }
      ritual_witnesses: {
        Row: {
          created_at: string | null
          id: string
          thread_id: string
          witness_note: string | null
          witness_user_id: string
          witnessed_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          thread_id: string
          witness_note?: string | null
          witness_user_id: string
          witnessed_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          thread_id?: string
          witness_note?: string | null
          witness_user_id?: string
          witnessed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ritual_witnesses_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "room_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      room_memberships: {
        Row: {
          id: string
          joined_at: string
          last_active_at: string | null
          role: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          last_active_at?: string | null
          role?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          last_active_at?: string | null
          role?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_memberships_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "lighthouse_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_threads: {
        Row: {
          author_id: string
          comment_count: number
          content: string
          created_at: string
          garden_position_x: number | null
          garden_position_z: number | null
          id: string
          image_metadata: Json | null
          image_urls: string[] | null
          is_auto_verified: boolean | null
          metadata: Json | null
          room_id: string
          status: Database["public"]["Enums"]["thread_status"]
          title: string
          tree_growth_stage: number | null
          trust_score: number | null
          updated_at: string
          upvote_count: number
          verification_id: string | null
          view_count: number
        }
        Insert: {
          author_id: string
          comment_count?: number
          content: string
          created_at?: string
          garden_position_x?: number | null
          garden_position_z?: number | null
          id?: string
          image_metadata?: Json | null
          image_urls?: string[] | null
          is_auto_verified?: boolean | null
          metadata?: Json | null
          room_id: string
          status?: Database["public"]["Enums"]["thread_status"]
          title: string
          tree_growth_stage?: number | null
          trust_score?: number | null
          updated_at?: string
          upvote_count?: number
          verification_id?: string | null
          view_count?: number
        }
        Update: {
          author_id?: string
          comment_count?: number
          content?: string
          created_at?: string
          garden_position_x?: number | null
          garden_position_z?: number | null
          id?: string
          image_metadata?: Json | null
          image_urls?: string[] | null
          is_auto_verified?: boolean | null
          metadata?: Json | null
          room_id?: string
          status?: Database["public"]["Enums"]["thread_status"]
          title?: string
          tree_growth_stage?: number | null
          trust_score?: number | null
          updated_at?: string
          upvote_count?: number
          verification_id?: string | null
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "room_threads_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "lighthouse_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_threads_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      share_analytics: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          id: string
          ip_address: unknown | null
          platform: string
          referrer: string | null
          share_token: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          platform: string
          referrer?: string | null
          share_token: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          platform?: string
          referrer?: string | null
          share_token?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      signal_feed: {
        Row: {
          created_at: string
          engagement_score: number
          expires_at: string | null
          featured_at: string | null
          id: string
          thread_id: string
          trending_rank: number | null
          trust_score: number
        }
        Insert: {
          created_at?: string
          engagement_score?: number
          expires_at?: string | null
          featured_at?: string | null
          id?: string
          thread_id: string
          trending_rank?: number | null
          trust_score: number
        }
        Update: {
          created_at?: string
          engagement_score?: number
          expires_at?: string | null
          featured_at?: string | null
          id?: string
          thread_id?: string
          trending_rank?: number | null
          trust_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "signal_feed_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "room_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      source_reputation: {
        Row: {
          accuracy_rate: number | null
          base_score: number
          created_at: string
          domain: string
          editorial_quality: number | null
          factual_reporting_score: number | null
          failed_verifications: number
          funding_sources: Json | null
          id: string
          last_verified_at: string | null
          metadata: Json | null
          owner_entity: string | null
          political_bias: number | null
          political_leaning_score: number | null
          region: string | null
          source_type: string | null
          successful_verifications: number
          transparency_rating: string | null
          updated_at: string
          verification_count: number
        }
        Insert: {
          accuracy_rate?: number | null
          base_score?: number
          created_at?: string
          domain: string
          editorial_quality?: number | null
          factual_reporting_score?: number | null
          failed_verifications?: number
          funding_sources?: Json | null
          id?: string
          last_verified_at?: string | null
          metadata?: Json | null
          owner_entity?: string | null
          political_bias?: number | null
          political_leaning_score?: number | null
          region?: string | null
          source_type?: string | null
          successful_verifications?: number
          transparency_rating?: string | null
          updated_at?: string
          verification_count?: number
        }
        Update: {
          accuracy_rate?: number | null
          base_score?: number
          created_at?: string
          domain?: string
          editorial_quality?: number | null
          factual_reporting_score?: number | null
          failed_verifications?: number
          funding_sources?: Json | null
          id?: string
          last_verified_at?: string | null
          metadata?: Json | null
          owner_entity?: string | null
          political_bias?: number | null
          political_leaning_score?: number | null
          region?: string | null
          source_type?: string | null
          successful_verifications?: number
          transparency_rating?: string | null
          updated_at?: string
          verification_count?: number
        }
        Relationships: []
      }
      sources: {
        Row: {
          adjusted_reliability_score: number | null
          base_reliability_score: number | null
          content_snippet: string | null
          created_at: string
          domain: string | null
          full_content: string | null
          id: string
          political_bias: number | null
          reliability_score: number | null
          source_region: string | null
          source_type: string | null
          title: string | null
          url: string
          verification_id: string
        }
        Insert: {
          adjusted_reliability_score?: number | null
          base_reliability_score?: number | null
          content_snippet?: string | null
          created_at?: string
          domain?: string | null
          full_content?: string | null
          id?: string
          political_bias?: number | null
          reliability_score?: number | null
          source_region?: string | null
          source_type?: string | null
          title?: string | null
          url: string
          verification_id: string
        }
        Update: {
          adjusted_reliability_score?: number | null
          base_reliability_score?: number | null
          content_snippet?: string | null
          created_at?: string
          domain?: string | null
          full_content?: string | null
          id?: string
          political_bias?: number | null
          reliability_score?: number | null
          source_region?: string | null
          source_type?: string | null
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
          user_id: string
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
          user_id: string
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
          user_id?: string
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
      thread_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          image_metadata: Json | null
          image_urls: string[] | null
          parent_comment_id: string | null
          thread_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          image_metadata?: Json | null
          image_urls?: string[] | null
          parent_comment_id?: string | null
          thread_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          image_metadata?: Json | null
          image_urls?: string[] | null
          parent_comment_id?: string | null
          thread_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "thread_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "thread_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thread_comments_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "room_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      thread_votes: {
        Row: {
          created_at: string
          id: string
          thread_id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          thread_id: string
          user_id: string
          vote_type: string
        }
        Update: {
          created_at?: string
          id?: string
          thread_id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "thread_votes_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "room_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      trust_analytics: {
        Row: {
          analysis_period_end: string
          analysis_period_start: string
          average_trust_score: number
          created_at: string | null
          credibility_tier: string | null
          domain: string | null
          id: string
          metadata: Json | null
          region: string
          source: string
          topic: string
          trending_direction: string | null
          updated_at: string | null
          verification_count: number
          week_over_week_change: number | null
        }
        Insert: {
          analysis_period_end: string
          analysis_period_start: string
          average_trust_score: number
          created_at?: string | null
          credibility_tier?: string | null
          domain?: string | null
          id?: string
          metadata?: Json | null
          region: string
          source: string
          topic: string
          trending_direction?: string | null
          updated_at?: string | null
          verification_count?: number
          week_over_week_change?: number | null
        }
        Update: {
          analysis_period_end?: string
          analysis_period_start?: string
          average_trust_score?: number
          created_at?: string | null
          credibility_tier?: string | null
          domain?: string | null
          id?: string
          metadata?: Json | null
          region?: string
          source?: string
          topic?: string
          trending_direction?: string | null
          updated_at?: string | null
          verification_count?: number
          week_over_week_change?: number | null
        }
        Relationships: []
      }
      trust_briefs: {
        Row: {
          brief_content: string
          created_at: string | null
          id: string
          metadata: Json | null
          week_end: string
          week_start: string
        }
        Insert: {
          brief_content: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          week_end: string
          week_start: string
        }
        Update: {
          brief_content?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          week_end?: string
          week_start?: string
        }
        Relationships: []
      }
      trust_index_snapshots: {
        Row: {
          created_at: string | null
          global_trust_index: number
          high_credibility_percentage: number | null
          id: string
          metadata: Json | null
          misinformation_spike_regions: string[] | null
          snapshot_date: string
          total_verifications: number
          trending_low_topics: string[] | null
        }
        Insert: {
          created_at?: string | null
          global_trust_index: number
          high_credibility_percentage?: number | null
          id?: string
          metadata?: Json | null
          misinformation_spike_regions?: string[] | null
          snapshot_date: string
          total_verifications: number
          trending_low_topics?: string[] | null
        }
        Update: {
          created_at?: string | null
          global_trust_index?: number
          high_credibility_percentage?: number | null
          id?: string
          metadata?: Json | null
          misinformation_spike_regions?: string[] | null
          snapshot_date?: string
          total_verifications?: number
          trending_low_topics?: string[] | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_name: string
          badge_tier: Database["public"]["Enums"]["badge_tier"]
          description: string | null
          earned_at: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          badge_name: string
          badge_tier?: Database["public"]["Enums"]["badge_tier"]
          description?: string | null
          earned_at?: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          badge_name?: string
          badge_tier?: Database["public"]["Enums"]["badge_tier"]
          description?: string | null
          earned_at?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
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
      verification_categories: {
        Row: {
          confidence_weights: Json
          created_at: string
          description: string | null
          detection_patterns: Json
          display_name: string
          id: string
          is_active: boolean | null
          keywords: Json
          max_source_age_days: number | null
          min_sources: number | null
          name: string
          parent_category: string | null
          required_source_types: string[] | null
          updated_at: string
          verification_criteria: Json
        }
        Insert: {
          confidence_weights?: Json
          created_at?: string
          description?: string | null
          detection_patterns?: Json
          display_name: string
          id?: string
          is_active?: boolean | null
          keywords?: Json
          max_source_age_days?: number | null
          min_sources?: number | null
          name: string
          parent_category?: string | null
          required_source_types?: string[] | null
          updated_at?: string
          verification_criteria?: Json
        }
        Update: {
          confidence_weights?: Json
          created_at?: string
          description?: string | null
          detection_patterns?: Json
          display_name?: string
          id?: string
          is_active?: boolean | null
          keywords?: Json
          max_source_age_days?: number | null
          min_sources?: number | null
          name?: string
          parent_category?: string | null
          required_source_types?: string[] | null
          updated_at?: string
          verification_criteria?: Json
        }
        Relationships: []
      }
      verification_feedback: {
        Row: {
          comment: string | null
          created_at: string
          feedback_type: string
          id: string
          updated_at: string
          user_id: string | null
          verification_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          feedback_type: string
          id?: string
          updated_at?: string
          user_id?: string | null
          verification_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          feedback_type?: string
          id?: string
          updated_at?: string
          user_id?: string | null
          verification_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_feedback_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "verifications"
            referencedColumns: ["id"]
          },
        ]
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
      verification_shares: {
        Row: {
          avg_view_duration_seconds: number | null
          created_at: string
          geographic_spread: Json | null
          id: string
          share_count: number | null
          shared_to_platform: string
          unique_viewers: number | null
          updated_at: string
          verification_id: string
        }
        Insert: {
          avg_view_duration_seconds?: number | null
          created_at?: string
          geographic_spread?: Json | null
          id?: string
          share_count?: number | null
          shared_to_platform: string
          unique_viewers?: number | null
          updated_at?: string
          verification_id: string
        }
        Update: {
          avg_view_duration_seconds?: number | null
          created_at?: string
          geographic_spread?: Json | null
          id?: string
          share_count?: number | null
          shared_to_platform?: string
          unique_viewers?: number | null
          updated_at?: string
          verification_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_shares_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      verifications: {
        Row: {
          azure_embedding: string | null
          category: string | null
          category_confidence: number | null
          claim_type: string | null
          content: string
          content_type: string
          created_at: string
          detected_categories: Json | null
          detected_entities: Json | null
          device_type: string | null
          file_name: string | null
          file_size: number | null
          id: string
          processing_time_ms: number | null
          result_summary: string | null
          score_breakdown: Json | null
          sentiment_label: string | null
          sentiment_score: number | null
          session_id: string | null
          status: string
          time_to_verify_ms: number | null
          trust_score: number | null
          updated_at: string
          user_confidence_override: boolean | null
          user_id: string
          verification_source: string | null
        }
        Insert: {
          azure_embedding?: string | null
          category?: string | null
          category_confidence?: number | null
          claim_type?: string | null
          content: string
          content_type: string
          created_at?: string
          detected_categories?: Json | null
          detected_entities?: Json | null
          device_type?: string | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          processing_time_ms?: number | null
          result_summary?: string | null
          score_breakdown?: Json | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          session_id?: string | null
          status?: string
          time_to_verify_ms?: number | null
          trust_score?: number | null
          updated_at?: string
          user_confidence_override?: boolean | null
          user_id: string
          verification_source?: string | null
        }
        Update: {
          azure_embedding?: string | null
          category?: string | null
          category_confidence?: number | null
          claim_type?: string | null
          content?: string
          content_type?: string
          created_at?: string
          detected_categories?: Json | null
          detected_entities?: Json | null
          device_type?: string | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          processing_time_ms?: number | null
          result_summary?: string | null
          score_breakdown?: Json | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          session_id?: string | null
          status?: string
          time_to_verify_ms?: number | null
          trust_score?: number | null
          updated_at?: string
          user_confidence_override?: boolean | null
          user_id?: string
          verification_source?: string | null
        }
        Relationships: []
      }
      webhook_idempotency: {
        Row: {
          created_at: string | null
          id: string
          idempotency_key: string
          processed_at: string | null
          webhook_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          idempotency_key: string
          processed_at?: string | null
          webhook_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          idempotency_key?: string
          processed_at?: string | null
          webhook_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      admin_api_usage_stats: {
        Row: {
          active_days: number | null
          api_key_name: string | null
          failed_requests: number | null
          last_used: string | null
          successful_requests: number | null
          total_requests: number | null
          user_id: string | null
        }
        Relationships: []
      }
      admin_popular_analytics: {
        Row: {
          avg_response_time_ms: number | null
          endpoint: string | null
          error_count: number | null
          request_count: number | null
          success_count: number | null
        }
        Relationships: []
      }
      admin_revenue_stats: {
        Row: {
          avg_transaction: number | null
          month: string | null
          payment_count: number | null
          plan: Database["public"]["Enums"]["plan_type"] | null
          total_revenue: number | null
        }
        Relationships: []
      }
      engagement_analytics: {
        Row: {
          content_id: string | null
          content_type: string | null
          last_engagement_at: string | null
          total_clicks: number | null
          total_shares: number | null
          total_upvotes: number | null
          total_views: number | null
          unique_platforms: number | null
        }
        Relationships: []
      }
      payment_logs_summary: {
        Row: {
          created_at: string | null
          event_type: string | null
          id: string | null
          status: string | null
          status_description: string | null
        }
        Insert: {
          created_at?: string | null
          event_type?: string | null
          id?: string | null
          status?: string | null
          status_description?: never
        }
        Update: {
          created_at?: string | null
          event_type?: string | null
          id?: string | null
          status?: string | null
          status_description?: never
        }
        Relationships: []
      }
    }
    Functions: {
      backfill_source_regions: {
        Args: Record<PropertyKey, never>
        Returns: {
          breakdown: Json
          updated_count: number
        }[]
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      check_feature_access: {
        Args: { feature_name: string; user_uuid: string }
        Returns: boolean
      }
      cleanup_old_activities: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_webhook_idempotency: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      clear_user_verifications: {
        Args: { user_uuid: string }
        Returns: Json
      }
      create_trial_license: {
        Args: { user_uuid: string }
        Returns: Json
      }
      ensure_user_workspace: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_license_key: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_referral_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_adjusted_source_score: {
        Args: { _base_score: number; _domain: string }
        Returns: number
      }
      get_adjusted_source_scores_batch: {
        Args: { _base_scores: number[]; _domains: string[] }
        Returns: Json
      }
      get_admin_api_usage_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_days: number
          api_key_name: string
          failed_requests: number
          last_used: string
          successful_requests: number
          total_requests: number
          user_id: string
        }[]
      }
      get_admin_popular_analytics: {
        Args: Record<PropertyKey, never>
        Returns: {
          avg_response_time_ms: number
          endpoint: string
          error_count: number
          request_count: number
          success_count: number
        }[]
      }
      get_admin_revenue_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          avg_transaction: number
          month: string
          payment_count: number
          plan: Database["public"]["Enums"]["plan_type"]
          total_revenue: number
        }[]
      }
      get_engagement_analytics: {
        Args: { p_content_id?: string; p_content_type?: string }
        Returns: {
          content_id: string
          content_type: string
          last_engagement_at: string
          total_clicks: number
          total_shares: number
          total_upvotes: number
          total_views: number
          unique_platforms: number
        }[]
      }
      get_payment_logs_summary: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          event_type: string
          id: string
          status: string
          status_description: string
        }[]
      }
      get_payment_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_referral_stats: {
        Args: { user_uuid: string }
        Returns: Json
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
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
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
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      increment_license_usage: {
        Args: { amount?: number; user_uuid: string }
        Returns: Json
      }
      is_username_available: {
        Args: { username_to_check: string }
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      refresh_engagement_analytics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      reset_monthly_usage_for_free_users: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      search_users: {
        Args: { limit_count?: number; search_query: string }
        Returns: {
          avatar_url: string
          full_name: string
          user_id: string
          username: string
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
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
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "user"
      badge_tier:
        | "bronze"
        | "silver"
        | "gold"
        | "platinum"
        | "lighthouse_keeper"
      license_status: "active" | "expired" | "suspended" | "revoked"
      license_type: "trial" | "basic" | "professional" | "enterprise"
      payment_status: "pending" | "successful" | "failed"
      plan_type: "free" | "pro" | "enterprise"
      room_category:
        | "politics"
        | "health"
        | "climate"
        | "technology"
        | "media"
        | "general"
      room_type: "public" | "private" | "workspace"
      thread_status: "active" | "verified" | "disputed" | "archived"
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
      badge_tier: ["bronze", "silver", "gold", "platinum", "lighthouse_keeper"],
      license_status: ["active", "expired", "suspended", "revoked"],
      license_type: ["trial", "basic", "professional", "enterprise"],
      payment_status: ["pending", "successful", "failed"],
      plan_type: ["free", "pro", "enterprise"],
      room_category: [
        "politics",
        "health",
        "climate",
        "technology",
        "media",
        "general",
      ],
      room_type: ["public", "private", "workspace"],
      thread_status: ["active", "verified", "disputed", "archived"],
    },
  },
} as const
