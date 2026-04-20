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
      assessments: {
        Row: {
          ai_score_json: Json | null
          capabilities_json: Json
          created_at: string
          human_score_json: Json | null
          id: string
          level: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_mode: Database["public"]["Enums"]["reviewer_mode"]
          reviewer_notes: string | null
          status: Database["public"]["Enums"]["assessment_status"]
          trade: Database["public"]["Enums"]["trade_type"]
          updated_at: string
          video_path: string | null
          video_url: string | null
          worker_id: string
        }
        Insert: {
          ai_score_json?: Json | null
          capabilities_json?: Json
          created_at?: string
          human_score_json?: Json | null
          id?: string
          level?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_mode?: Database["public"]["Enums"]["reviewer_mode"]
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["assessment_status"]
          trade: Database["public"]["Enums"]["trade_type"]
          updated_at?: string
          video_path?: string | null
          video_url?: string | null
          worker_id: string
        }
        Update: {
          ai_score_json?: Json | null
          capabilities_json?: Json
          created_at?: string
          human_score_json?: Json | null
          id?: string
          level?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_mode?: Database["public"]["Enums"]["reviewer_mode"]
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["assessment_status"]
          trade?: Database["public"]["Enums"]["trade_type"]
          updated_at?: string
          video_path?: string | null
          video_url?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      employer_actions: {
        Row: {
          action: string
          created_at: string
          employer_id: string
          id: string
          worker_id: string
        }
        Insert: {
          action: string
          created_at?: string
          employer_id: string
          id?: string
          worker_id: string
        }
        Update: {
          action?: string
          created_at?: string
          employer_id?: string
          id?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employer_actions_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employer_profiles: {
        Row: {
          auth_user_id: string
          city: string
          company_name: string
          contact_name: string
          created_at: string
          id: string
          phone: string
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          city: string
          company_name: string
          contact_name: string
          created_at?: string
          id?: string
          phone: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          city?: string
          company_name?: string
          contact_name?: string
          created_at?: string
          id?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_posts: {
        Row: {
          city: string
          created_at: string
          description: string | null
          employer_id: string
          id: string
          status: string
          title: string
          trade: Database["public"]["Enums"]["trade_type"]
          updated_at: string
          wage_offered: number
        }
        Insert: {
          city: string
          created_at?: string
          description?: string | null
          employer_id: string
          id?: string
          status?: string
          title: string
          trade: Database["public"]["Enums"]["trade_type"]
          updated_at?: string
          wage_offered: number
        }
        Update: {
          city?: string
          created_at?: string
          description?: string | null
          employer_id?: string
          id?: string
          status?: string
          title?: string
          trade?: Database["public"]["Enums"]["trade_type"]
          updated_at?: string
          wage_offered?: number
        }
        Relationships: [
          {
            foreignKeyName: "job_posts_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employer_profiles"
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
      worker_profiles: {
        Row: {
          city: string
          created_at: string
          daily_wage: number
          experience_years: number
          id: string
          name: string
          trade: Database["public"]["Enums"]["trade_type"]
          updated_at: string
          worker_id: string
        }
        Insert: {
          city: string
          created_at?: string
          daily_wage?: number
          experience_years?: number
          id?: string
          name: string
          trade: Database["public"]["Enums"]["trade_type"]
          updated_at?: string
          worker_id: string
        }
        Update: {
          city?: string
          created_at?: string
          daily_wage?: number
          experience_years?: number
          id?: string
          name?: string
          trade?: Database["public"]["Enums"]["trade_type"]
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_profiles_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: true
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      workers: {
        Row: {
          auth_user_id: string
          created_at: string
          id: string
          language: Database["public"]["Enums"]["lang_type"]
          passport_slug: string | null
          phone: string
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          id?: string
          language?: Database["public"]["Enums"]["lang_type"]
          passport_slug?: string | null
          phone: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          id?: string
          language?: Database["public"]["Enums"]["lang_type"]
          passport_slug?: string | null
          phone?: string
          updated_at?: string
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
      app_role: "admin" | "reviewer" | "user" | "employer"
      assessment_status: "pending_review" | "verified" | "needs_rerecord"
      lang_type: "hi" | "en"
      reviewer_mode: "human_only" | "ai_only" | "human_and_ai"
      trade_type: "electrician" | "plumber" | "welder" | "carpenter" | "ac_tech"
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
      app_role: ["admin", "reviewer", "user", "employer"],
      assessment_status: ["pending_review", "verified", "needs_rerecord"],
      lang_type: ["hi", "en"],
      reviewer_mode: ["human_only", "ai_only", "human_and_ai"],
      trade_type: ["electrician", "plumber", "welder", "carpenter", "ac_tech"],
    },
  },
} as const
