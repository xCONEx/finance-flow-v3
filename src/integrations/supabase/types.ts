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
            referencedColumns: ["user_id"]
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
            referencedColumns: ["user_id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          cnpj: string | null
          company_id: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      equipment: {
        Row: {
          category: string
          created_at: string
          depreciation_rate: number | null
          id: string
          name: string
          purchase_date: string | null
          purchase_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          depreciation_rate?: number | null
          id?: string
          name: string
          purchase_date?: string | null
          purchase_value: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          depreciation_rate?: number | null
          id?: string
          name?: string
          purchase_date?: string | null
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
            referencedColumns: ["user_id"]
          },
        ]
      }
      expenses: {
        Row: {
          agency_id: string | null
          amount: number
          category: string
          created_at: string
          date: string
          description: string | null
          id: string
          recurrence: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agency_id?: string | null
          amount: number
          category: string
          created_at?: string
          date: string
          description?: string | null
          id?: string
          recurrence?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agency_id?: string | null
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          recurrence?: string | null
          updated_at?: string
          user_id?: string
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
            referencedColumns: ["user_id"]
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
          service_value: number | null
          status: string
          total_costs: number
          updated_at: string
          user_id: string
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
          service_value?: number | null
          status?: string
          total_costs: number
          updated_at?: string
          user_id: string
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
          service_value?: number | null
          status?: string
          total_costs?: number
          updated_at?: string
          user_id?: string
          value_with_discount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      kanban_boards: {
        Row: {
          agency_id: string | null
          assignee: string | null
          client: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          links: string[] | null
          priority: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agency_id?: string | null
          assignee?: string | null
          client: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          links?: string[] | null
          priority?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agency_id?: string | null
          assignee?: string | null
          client?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          links?: string[] | null
          priority?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kanban_boards_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kanban_boards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          agency_id: string | null
          banned: boolean | null
          company: string | null
          created_at: string
          email: string
          id: string
          image_user: string | null
          logo_base64: string | null
          name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          subscription: Database["public"]["Enums"]["subscription_type"] | null
          subscription_data: Json | null
          updated_at: string
          user_id: string
          user_type: string | null
        }
        Insert: {
          agency_id?: string | null
          banned?: boolean | null
          company?: string | null
          created_at?: string
          email: string
          id?: string
          image_user?: string | null
          logo_base64?: string | null
          name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          subscription?: Database["public"]["Enums"]["subscription_type"] | null
          subscription_data?: Json | null
          updated_at?: string
          user_id: string
          user_type?: string | null
        }
        Update: {
          agency_id?: string | null
          banned?: boolean | null
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          image_user?: string | null
          logo_base64?: string | null
          name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          subscription?: Database["public"]["Enums"]["subscription_type"] | null
          subscription_data?: Json | null
          updated_at?: string
          user_id?: string
          user_type?: string | null
        }
        Relationships: []
      }
      work_routine: {
        Row: {
          created_at: string
          id: string
          monthly_costs: number
          profit_margin: number
          updated_at: string
          user_id: string
          value_per_hour: number
          working_days_per_month: number
          working_hours_per_day: number
        }
        Insert: {
          created_at?: string
          id?: string
          monthly_costs: number
          profit_margin: number
          updated_at?: string
          user_id: string
          value_per_hour: number
          working_days_per_month: number
          working_hours_per_day: number
        }
        Update: {
          created_at?: string
          id?: string
          monthly_costs?: number
          profit_margin?: number
          updated_at?: string
          user_id?: string
          value_per_hour?: number
          working_days_per_month?: number
          working_hours_per_day?: number
        }
        Relationships: [
          {
            foreignKeyName: "work_routine_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
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
      subscription_type: "free" | "premium" | "enterprise" | "enterprise-annual"
      user_role: "owner" | "editor" | "viewer"
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
