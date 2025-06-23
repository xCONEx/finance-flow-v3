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
          id: string
          name: string
          description: string | null
          owner_id: string
          created_at: string | null
          status: string | null
          cnpj: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          owner_id: string
          created_at?: string | null
          status?: string | null
          cnpj?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          owner_id?: string
          created_at?: string | null
          status?: string | null
          cnpj?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agencies_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_collaborators: {
        Row: {
          id: string
          agency_id: string | null
          user_id: string | null
          role: string | null
          created_at: string | null
          added_at: string | null
        }
        Insert: {
          id?: string
          agency_id?: string | null
          user_id?: string | null
          role?: string | null
          created_at?: string | null
          added_at?: string | null
        }
        Update: {
          id?: string
          agency_id?: string | null
          user_id?: string | null
          role?: string | null
          created_at?: string | null
          added_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agency_collaborators_user_id_fkey"
            columns: ["user_id"]
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
        ]
      }
      clients: {
        Row: {
          id: string
          user_id: string
          company_id: string | null
          name: string
          phone: string | null
          email: string | null
          address: string | null
          cnpj: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_id?: string | null
          name: string
          phone?: string | null
          email?: string | null
          address?: string | null
          cnpj?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_id?: string | null
          name?: string
          phone?: string | null
          email?: string | null
          address?: string | null
          cnpj?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          id: string
          user_id: string
          agency_id: string | null
          description: string
          category: string
          value: number
          depreciation_years: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          agency_id?: string | null
          description: string
          category: string
          value?: number
          depreciation_years?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          agency_id?: string | null
          description?: string
          category?: string
          value?: number
          depreciation_years?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          id: string
          user_id: string
          agency_id: string | null
          description: string
          category: string
          value: number
          month: string
          created_at: string | null
          updated_at: string | null
          due_date: string | null
          is_recurring: boolean | null
          installments: number | null
          current_installment: number | null
          parent_id: string | null
          notification_enabled: boolean | null
        }
        Insert: {
          id?: string
          user_id: string
          agency_id?: string | null
          description: string
          category: string
          value?: number
          month: string
          created_at?: string | null
          updated_at?: string | null
          due_date?: string | null
          is_recurring?: boolean | null
          installments?: number | null
          current_installment?: number | null
          parent_id?: string | null
          notification_enabled?: boolean | null
        }
        Update: {
          id?: string
          user_id?: string
          agency_id?: string | null
          description?: string
          category?: string
          value?: number
          month?: string
          created_at?: string | null
          updated_at?: string | null
          due_date?: string | null
          is_recurring?: boolean | null
          installments?: number | null
          current_installment?: number | null
          parent_id?: string | null
          notification_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          id: string
          user_id: string
          agency_id: string | null
          description: string
          client: string
          event_date: string | null
          estimated_hours: number | null
          difficulty_level: Database["public"]["Enums"]["difficulty_level"] | null
          logistics: number | null
          equipment: number | null
          assistance: number | null
          status: Database["public"]["Enums"]["job_status"] | null
          category: string | null
          discount_value: number | null
          total_costs: number | null
          service_value: number | null
          value_with_discount: number | null
          profit_margin: number | null
          created_at: string | null
          updated_at: string | null
          client_id: string | null
          is_approved: boolean | null
        }
        Insert: {
          id?: string
          user_id: string
          agency_id?: string | null
          description: string
          client: string
          event_date?: string | null
          estimated_hours?: number | null
          difficulty_level?: Database["public"]["Enums"]["difficulty_level"] | null
          logistics?: number | null
          equipment?: number | null
          assistance?: number | null
          status?: Database["public"]["Enums"]["job_status"] | null
          category?: string | null
          discount_value?: number | null
          total_costs?: number | null
          service_value?: number | null
          value_with_discount?: number | null
          profit_margin?: number | null
          created_at?: string | null
          updated_at?: string | null
          client_id?: string | null
          is_approved?: boolean | null
        }
        Update: {
          id?: string
          user_id?: string
          agency_id?: string | null
          description?: string
          client?: string
          event_date?: string | null
          estimated_hours?: number | null
          difficulty_level?: Database["public"]["Enums"]["difficulty_level"] | null
          logistics?: number | null
          equipment?: number | null
          assistance?: number | null
          status?: Database["public"]["Enums"]["job_status"] | null
          category?: string | null
          discount_value?: number | null
          total_costs?: number | null
          service_value?: number | null
          value_with_discount?: number | null
          profit_margin?: number | null
          created_at?: string | null
          updated_at?: string | null
          client_id?: string | null
          is_approved?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_boards: {
        Row: {
          id: string
          user_id: string | null
          title: string
          client: string
          due_date: string | null
          priority: string | null
          status: string | null
          description: string | null
          links: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          title: string
          client: string
          due_date?: string | null
          priority?: string | null
          status?: string | null
          description?: string | null
          links?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string
          client?: string
          due_date?: string | null
          priority?: string | null
          status?: string | null
          description?: string | null
          links?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kanban_boards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          phone: string | null
          company: string | null
          logo_base64: string | null
          image_user: string | null
          user_type: Database["public"]["Enums"]["user_type"] | null
          banned: boolean | null
          agency_id: string | null
          role: Database["public"]["Enums"]["agency_role"] | null
          created_at: string | null
          updated_at: string | null
          subscription: Database["public"]["Enums"]["subscription_type"] | null
          subscription_data: Json | null
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          phone?: string | null
          company?: string | null
          logo_base64?: string | null
          image_user?: string | null
          user_type?: Database["public"]["Enums"]["user_type"] | null
          banned?: boolean | null
          agency_id?: string | null
          role?: Database["public"]["Enums"]["agency_role"] | null
          created_at?: string | null
          updated_at?: string | null
          subscription?: Database["public"]["Enums"]["subscription_type"] | null
          subscription_data?: Json | null
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          phone?: string | null
          company?: string | null
          logo_base64?: string | null
          image_user?: string | null
          user_type?: Database["public"]["Enums"]["user_type"] | null
          banned?: boolean | null
          agency_id?: string | null
          role?: Database["public"]["Enums"]["agency_role"] | null
          created_at?: string | null
          updated_at?: string | null
          subscription?: Database["public"]["Enums"]["subscription_type"] | null
          subscription_data?: Json | null
        }
        Relationships: []
      }
      work_routine: {
        Row: {
          id: string
          user_id: string
          desired_salary: number | null
          work_days_per_month: number | null
          work_hours_per_day: number | null
          value_per_day: number | null
          value_per_hour: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          desired_salary?: number | null
          work_days_per_month?: number | null
          work_hours_per_day?: number | null
          value_per_day?: number | null
          value_per_hour?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          desired_salary?: number | null
          work_days_per_month?: number | null
          work_hours_per_day?: number | null
          value_per_day?: number | null
          value_per_hour?: number | null
          created_at?: string | null
          updated_at?: string | null
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
      subscription_type:
        | "free"
        | "premium"
        | "enterprise"
        | "basic"
        | "enterprise-annual"
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
      subscription_type: [
        "free",
        "premium",
        "enterprise",
        "basic",
        "enterprise-annual",
      ],
      user_type: ["individual", "company_owner", "employee", "admin"],
    },
  },
} as const
