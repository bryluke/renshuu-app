export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      daily_summaries: {
        Row: {
          created_at: string | null
          days_since_last_log: number | null
          id: string
          meals_logged: number | null
          summary_date: string
          target_calories: number | null
          target_carbs_g: number | null
          target_fats_g: number | null
          target_fiber_g: number | null
          target_protein_g: number | null
          total_calories: number
          total_carbs_g: number
          total_fats_g: number
          total_fiber_g: number
          total_protein_g: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          days_since_last_log?: number | null
          id?: string
          meals_logged?: number | null
          summary_date: string
          target_calories?: number | null
          target_carbs_g?: number | null
          target_fats_g?: number | null
          target_fiber_g?: number | null
          target_protein_g?: number | null
          total_calories?: number
          total_carbs_g?: number
          total_fats_g?: number
          total_fiber_g?: number
          total_protein_g?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          days_since_last_log?: number | null
          id?: string
          meals_logged?: number | null
          summary_date?: string
          target_calories?: number | null
          target_carbs_g?: number | null
          target_fats_g?: number | null
          target_fiber_g?: number | null
          target_protein_g?: number | null
          total_calories?: number
          total_carbs_g?: number
          total_fats_g?: number
          total_fiber_g?: number
          total_protein_g?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_summaries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      food_addons: {
        Row: {
          calories: number
          carbs_g: number
          category: string | null
          created_at: string | null
          display_name: string
          fats_g: number
          fiber_g: number | null
          food_id: string | null
          id: string
          name: string | null
          protein_g: number
          updated_at: string | null
        }
        Insert: {
          calories: number
          carbs_g: number
          category?: string | null
          created_at?: string | null
          display_name: string
          fats_g: number
          fiber_g?: number | null
          food_id?: string | null
          id?: string
          name?: string | null
          protein_g: number
          updated_at?: string | null
        }
        Update: {
          calories?: number
          carbs_g?: number
          category?: string | null
          created_at?: string | null
          display_name?: string
          fats_g?: number
          fiber_g?: number | null
          food_id?: string | null
          id?: string
          name?: string | null
          protein_g?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "food_addons_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
        ]
      }
      food_portions: {
        Row: {
          calories: number
          carbs_g: number
          created_at: string | null
          description: string | null
          display_name: string
          fats_g: number
          fiber_g: number | null
          food_id: string | null
          id: string
          name: string | null
          protein_g: number
          updated_at: string | null
        }
        Insert: {
          calories: number
          carbs_g: number
          created_at?: string | null
          description?: string | null
          display_name: string
          fats_g: number
          fiber_g?: number | null
          food_id?: string | null
          id?: string
          name?: string | null
          protein_g: number
          updated_at?: string | null
        }
        Update: {
          calories?: number
          carbs_g?: number
          created_at?: string | null
          description?: string | null
          display_name?: string
          fats_g?: number
          fiber_g?: number | null
          food_id?: string | null
          id?: string
          name?: string | null
          protein_g?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "food_portions_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
        ]
      }
      food_requests: {
        Row: {
          created_at: string | null
          created_food_id: string | null
          description: string | null
          food_name: string
          id: string
          requested_by: string | null
          review_notes: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string | null
          where_found: string | null
        }
        Insert: {
          created_at?: string | null
          created_food_id?: string | null
          description?: string | null
          food_name: string
          id?: string
          requested_by?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          where_found?: string | null
        }
        Update: {
          created_at?: string | null
          created_food_id?: string | null
          description?: string | null
          food_name?: string
          id?: string
          requested_by?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          where_found?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "food_requests_created_food_id_fkey"
            columns: ["created_food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      foods: {
        Row: {
          approved_by: string | null
          category: string
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_approved: boolean | null
          name: string | null
          requested_by: string | null
          subcategory: string | null
          updated_at: string | null
        }
        Insert: {
          approved_by?: string | null
          category: string
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_approved?: boolean | null
          name?: string | null
          requested_by?: string | null
          subcategory?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_by?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_approved?: boolean | null
          name?: string | null
          requested_by?: string | null
          subcategory?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "foods_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "foods_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_foods: {
        Row: {
          addons_display: string[] | null
          calories: number
          carbs_g: number
          created_at: string | null
          fats_g: number
          fiber_g: number | null
          food_id: string | null
          food_name: string
          id: string
          meal_id: string | null
          portion_display: string
          portion_id: string | null
          protein_g: number
          selected_addons: string[] | null
        }
        Insert: {
          addons_display?: string[] | null
          calories: number
          carbs_g: number
          created_at?: string | null
          fats_g: number
          fiber_g?: number | null
          food_id?: string | null
          food_name: string
          id?: string
          meal_id?: string | null
          portion_display: string
          portion_id?: string | null
          protein_g: number
          selected_addons?: string[] | null
        }
        Update: {
          addons_display?: string[] | null
          calories?: number
          carbs_g?: number
          created_at?: string | null
          fats_g?: number
          fiber_g?: number | null
          food_id?: string | null
          food_name?: string
          id?: string
          meal_id?: string | null
          portion_display?: string
          portion_id?: string | null
          protein_g?: number
          selected_addons?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_foods_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_foods_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_foods_portion_id_fkey"
            columns: ["portion_id"]
            isOneToOne: false
            referencedRelation: "food_portions"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          created_at: string | null
          id: string
          meal_date: string
          meal_type: string
          total_calories: number | null
          total_carbs_g: number | null
          total_fats_g: number | null
          total_fiber_g: number | null
          total_protein_g: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          meal_date: string
          meal_type: string
          total_calories?: number | null
          total_carbs_g?: number | null
          total_fats_g?: number | null
          total_fiber_g?: number | null
          total_protein_g?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          meal_date?: string
          meal_type?: string
          total_calories?: number | null
          total_carbs_g?: number | null
          total_fats_g?: number | null
          total_fiber_g?: number | null
          total_protein_g?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          assigned_trainer_id: string | null
          business_id: string | null
          created_at: string | null
          dietary_restrictions: string[] | null
          full_name: string
          height_cm: number | null
          id: string
          is_active: boolean | null
          role: string
          updated_at: string | null
          weight_kg: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          assigned_trainer_id?: string | null
          business_id?: string | null
          created_at?: string | null
          dietary_restrictions?: string[] | null
          full_name: string
          height_cm?: number | null
          id: string
          is_active?: boolean | null
          role?: string
          updated_at?: string | null
          weight_kg?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          assigned_trainer_id?: string | null
          business_id?: string | null
          created_at?: string | null
          dietary_restrictions?: string[] | null
          full_name?: string
          height_cm?: number | null
          id?: string
          is_active?: boolean | null
          role?: string
          updated_at?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_assigned_trainer_id_fkey"
            columns: ["assigned_trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_goals: {
        Row: {
          created_at: string | null
          daily_calorie: number
          daily_carbs_g: number
          daily_fats_g: number
          daily_fiber_g: number
          daily_protein_g: number
          end_date: string | null
          id: string
          is_active: boolean | null
          reason: string | null
          set_by: string
          set_by_user_id: string | null
          start_date: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          daily_calorie: number
          daily_carbs_g: number
          daily_fats_g: number
          daily_fiber_g: number
          daily_protein_g: number
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          reason?: string | null
          set_by: string
          set_by_user_id?: string | null
          start_date: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          daily_calorie?: number
          daily_carbs_g?: number
          daily_fats_g?: number
          daily_fiber_g?: number
          daily_protein_g?: number
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          reason?: string | null
          set_by?: string
          set_by_user_id?: string | null
          start_date?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_goals_set_by_user_id_fkey"
            columns: ["set_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weight_logs: {
        Row: {
          created_at: string | null
          id: string
          log_date: string
          notes: string | null
          updated_at: string | null
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          log_date: string
          notes?: string | null
          updated_at?: string | null
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string | null
          id?: string
          log_date?: string
          notes?: string | null
          updated_at?: string | null
          user_id?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "weight_logs_user_id_fkey"
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
      get_user_role: { Args: { user_id: string }; Returns: string }
      recalculate_daily_summary: {
        Args: { p_date: string; p_user_id: string }
        Returns: undefined
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

