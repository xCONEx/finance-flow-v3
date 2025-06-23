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
          created_at: string
          id: string
          name: string
          owner_uid: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_uid: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_uid?: string
          status?: string
          updated_at?: string
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
          agency_id: string
          created_at: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
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
          created_at: string
          depreciation_value: number | null
          id: string
          name: string
          purchase_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          depreciation_value?: number | null
          id?: string
          name: string
          purchase_value: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          depreciation_value?: number | null
          id?: string
          name?: string
          purchase_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
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
          amount: number
          category: string
          created_at: string
          description: string | null
          id: string
          recurring: boolean | null
          transaction_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          description?: string | null
          id?: string
          recurring?: boolean | null
          transaction_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          recurring?: boolean | null
          transaction_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
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
          assistance: number | null
          category: string | null
          client: string
          client_id: string | null
          created_at: string
          description: string
          difficulty_level: string
          discount_value: number | null
          equipment: number | null
          estimated_hours: number
          event_date: string | null
          id: string
          logistics: number | null
          profit_margin: number | null
          service_value: number
          status: string
          total_costs: number
          updated_at: string
          userId: string
          value_with_discount: number | null
        }
        Insert: {
          assistance?: number | null
          category?: string | null
          client: string
          client_id?: string | null
          created_at?: string
          description: string
          difficulty_level: string
          discount_value?: number | null
          equipment?: number | null
          estimated_hours: number
          event_date?: string | null
          id?: string
          logistics?: number | null
          profit_margin?: number | null
          service_value: number
          status?: string
          total_costs: number
          updated_at?: string
          userId: string
          value_with_discount?: number | null
        }
        Update: {
          assistance?: number | null
          category?: string | null
          client?: string
          client_id?: string | null
          created_at?: string
          description?: string
          difficulty_level?: string
          discount_value?: number | null
          equipment?: number | null
          estimated_hours?: number
          event_date?: string | null
          id?: string
          logistics?: number | null
          profit_margin?: number | null
          service_value?: number
          status?: string
          total_costs?: number
          updated_at?: string
          userId?: string
          value_with_discount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_userId_fkey"
            columns: ["userId"]
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
        ]
      }
      kanban_boards: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
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
          agency_id: string | null
          banned: boolean
          company: string | null
          created_at: string
          email: string | null
          id: string
          image_user: string | null
          logo_base64: string | null
          name: string | null
          phone: string | null
          role: "owner" | "editor" | "viewer"
          subscription: "free" | "premium" | "enterprise" | "enterprise-annual"
          subscription_data: Json | null
          updated_at: string
          user_type: string | null
        }
        Insert: {
          agency_id?: string | null
          banned?: boolean
          company?: string | null
          created_at?: string
          email?: string | null
          id: string
          image_user?: string | null
          logo_base64?: string | null
          name?: string | null
          phone?: string | null
          role?: "owner" | "editor" | "viewer"
          subscription?: "free" | "premium" | "enterprise" | "enterprise-annual"
          subscription_data?: Json | null
          updated_at?: string
          user_type?: string | null
        }
        Update: {
          agency_id?: string | null
          banned?: boolean
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          image_user?: string | null
          logo_base64?: string | null
          name?: string | null
          phone?: string | null
          role?: "owner" | "editor" | "viewer"
          subscription?: "free" | "premium" | "enterprise" | "enterprise-annual"
          subscription_data?: Json | null
          updated_at?: string
          user_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      work_routine: {
        Row: {
          created_at: string
          hours_per_day: number
          id: string
          monthly_goals: number
          updated_at: string
          user_id: string
          value_per_hour: number
          working_days_per_month: number
        }
        Insert: {
          created_at?: string
          hours_per_day: number
          id?: string
          monthly_goals: number
          updated_at?: string
          user_id: string
          value_per_hour: number
          working_days_per_month: number
        }
        Update: {
          created_at?: string
          hours_per_day?: number
          id?: string
          monthly_goals?: number
          updated_at?: string
          user_id?: string
          value_per_hour?: number
          working_days_per_month?: number
        }
        Relationships: [
          {
            foreignKeyName: "work_routine_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
