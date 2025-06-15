export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agencies: {
        Row: {
          created_at: string | null
          id: string
          name: string
          owner_uid: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          owner_uid: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          owner_uid?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agencies_owner_uid_fkey"
            columns: ["owner_uid"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_collaborators: {
        Row: {
          added_at: string | null
          added_by: string | null
          agency_id: string
          id: string
          role: Database["public"]["Enums"]["agency_role"]
          user_id: string
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          agency_id: string
          id?: string
          role?: Database["public"]["Enums"]["agency_role"]
          user_id: string
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          agency_id?: string
          id?: string
          role?: Database["public"]["Enums"]["agency_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_collaborators_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_collaborators_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_collaborators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          agency_id: string | null
          category: string
          created_at: string | null
          depreciation_years: number | null
          description: string
          id: string
          updated_at: string | null
          user_id: string
          value: number
        }
        Insert: {
          agency_id?: string | null
          category: string
          created_at?: string | null
          depreciation_years?: number | null
          description: string
          id?: string
          updated_at?: string | null
          user_id: string
          value?: number
        }
        Update: {
          agency_id?: string | null
          category?: string
          created_at?: string | null
          depreciation_years?: number | null
          description?: string
          id?: string
          updated_at?: string | null
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "equipment_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          agency_id: string | null
          category: string
          created_at: string | null
          description: string
          id: string
          month: string
          updated_at: string | null
          user_id: string
          value: number
        }
        Insert: {
          agency_id?: string | null
          category: string
          created_at?: string | null
          description: string
          id?: string
          month: string
          updated_at?: string | null
          user_id: string
          value?: number
        }
        Update: {
          agency_id?: string | null
          category?: string
          created_at?: string | null
          description?: string
          id?: string
          month?: string
          updated_at?: string | null
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "expenses_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          agency_id: string | null
          assistance: number | null
          category: string | null
          client: string
          created_at: string | null
          description: string
          difficulty_level:
            | Database["public"]["Enums"]["difficulty_level"]
            | null
          discount_value: number | null
          equipment: number | null
          estimated_hours: number | null
          event_date: string | null
          id: string
          logistics: number | null
          profit_margin: number | null
          service_value: number | null
          status: Database["public"]["Enums"]["job_status"] | null
          total_costs: number | null
          updated_at: string | null
          user_id: string
          value_with_discount: number | null
        }
        Insert: {
          agency_id?: string | null
          assistance?: number | null
          category?: string | null
          client: string
          created_at?: string | null
          description: string
          difficulty_level?:
            | Database["public"]["Enums"]["difficulty_level"]
            | null
          discount_value?: number | null
          equipment?: number | null
          estimated_hours?: number | null
          event_date?: string | null
          id?: string
          logistics?: number | null
          profit_margin?: number | null
          service_value?: number | null
          status?: Database["public"]["Enums"]["job_status"] | null
          total_costs?: number | null
          updated_at?: string | null
          user_id: string
          value_with_discount?: number | null
        }
        Update: {
          agency_id?: string | null
          assistance?: number | null
          category?: string | null
          client?: string
          created_at?: string | null
          description?: string
          difficulty_level?:
            | Database["public"]["Enums"]["difficulty_level"]
            | null
          discount_value?: number | null
          equipment?: number | null
          estimated_hours?: number | null
          event_date?: string | null
          id?: string
          logistics?: number | null
          profit_margin?: number | null
          service_value?: number | null
          status?: Database["public"]["Enums"]["job_status"] | null
          total_costs?: number | null
          updated_at?: string | null
          user_id?: string
          value_with_discount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_boards: {
        Row: {
          agency_id: string
          board_data: Json | null
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          agency_id: string
          board_data?: Json | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          agency_id?: string
          board_data?: Json | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kanban_boards_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          agency_id: string | null
          banned: boolean | null
          company: string | null
          created_at: string | null
          email: string
          id: string
          image_user: string | null
          logo_base64: string | null
          name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["agency_role"] | null
          subscription: Database["public"]["Enums"]["subscription_type"] | null
          updated_at: string | null
          user_type: Database["public"]["Enums"]["user_type"] | null
        }
        Insert: {
          agency_id?: string | null
          banned?: boolean | null
          company?: string | null
          created_at?: string | null
          email: string
          id: string
          image_user?: string | null
          logo_base64?: string | null
          name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["agency_role"] | null
          subscription?: Database["public"]["Enums"]["subscription_type"] | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Update: {
          agency_id?: string | null
          banned?: boolean | null
          company?: string | null
          created_at?: string | null
          email?: string
          id?: string
          image_user?: string | null
          logo_base64?: string | null
          name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["agency_role"] | null
          subscription?: Database["public"]["Enums"]["subscription_type"] | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Relationships: []
      }
      work_routine: {
        Row: {
          created_at: string | null
          desired_salary: number | null
          id: string
          updated_at: string | null
          user_id: string
          value_per_day: number | null
          value_per_hour: number | null
          work_days_per_month: number | null
          work_hours_per_day: number | null
        }
        Insert: {
          created_at?: string | null
          desired_salary?: number | null
          id?: string
          updated_at?: string | null
          user_id: string
          value_per_day?: number | null
          value_per_hour?: number | null
          work_days_per_month?: number | null
          work_hours_per_day?: number | null
        }
        Update: {
          created_at?: string | null
          desired_salary?: number | null
          id?: string
          updated_at?: string | null
          user_id?: string
          value_per_day?: number | null
          value_per_hour?: number | null
          work_days_per_month?: number | null
          work_hours_per_day?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "work_routine_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      agency_role: "owner" | "editor" | "viewer"
      difficulty_level: "fácil" | "médio" | "complicado" | "difícil"
      job_status: "pendente" | "aprovado"
      subscription_type: "free" | "premium" | "enterprise"
      user_type: "individual" | "company_owner" | "employee" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      agency_role: ["owner", "editor", "viewer"],
      difficulty_level: ["fácil", "médio", "complicado", "difícil"],
      job_status: ["pendente", "aprovado"],
      subscription_type: ["free", "premium", "enterprise"],
      user_type: ["individual", "company_owner", "employee", "admin"],
    },
  },
} as const
