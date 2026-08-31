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
      coach_athlete_relationships: {
        Row: {
          athlete_id: string | null
          coach_id: string | null
          created_at: string | null
          id: string
          status: string
        }
        Insert: {
          athlete_id?: string | null
          coach_id?: string | null
          created_at?: string | null
          id?: string
          status?: string
        }
        Update: {
          athlete_id?: string | null
          coach_id?: string | null
          created_at?: string | null
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_athlete_relationships_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_athlete_relationships_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_library: {
        Row: {
          coach_id: string | null
          created_at: string | null
          id: string
          instructions: string | null
          muscle_group: string | null
          name: string
          video_url: string | null
        }
        Insert: {
          coach_id?: string | null
          created_at?: string | null
          id?: string
          instructions?: string | null
          muscle_group?: string | null
          name: string
          video_url?: string | null
        }
        Update: {
          coach_id?: string | null
          created_at?: string | null
          id?: string
          instructions?: string | null
          muscle_group?: string | null
          name?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_library_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_assignments: {
        Row: {
          active: boolean | null
          athlete_id: string | null
          created_at: string | null
          id: string
          plan_id: string | null
          start_date: string
        }
        Insert: {
          active?: boolean | null
          athlete_id?: string | null
          created_at?: string | null
          id?: string
          plan_id?: string | null
          start_date: string
        }
        Update: {
          active?: boolean | null
          athlete_id?: string | null
          created_at?: string | null
          id?: string
          plan_id?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_assignments_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_assignments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_days: {
        Row: {
          day_order: number
          id: string
          label: string
          plan_id: string | null
        }
        Insert: {
          day_order: number
          id?: string
          label: string
          plan_id?: string | null
        }
        Update: {
          day_order?: number
          id?: string
          label?: string
          plan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_days_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_exercises: {
        Row: {
          coach_notes: string | null
          exercise_id: string | null
          exercise_order: number
          id: string
          plan_day_id: string | null
          target_reps: string
          target_rest_seconds: number | null
          target_sets: number
        }
        Insert: {
          coach_notes?: string | null
          exercise_id?: string | null
          exercise_order: number
          id?: string
          plan_day_id?: string | null
          target_reps: string
          target_rest_seconds?: number | null
          target_sets: number
        }
        Update: {
          coach_notes?: string | null
          exercise_id?: string | null
          exercise_order?: number
          id?: string
          plan_day_id?: string | null
          target_reps?: string
          target_rest_seconds?: number | null
          target_sets?: number
        }
        Relationships: [
          {
            foreignKeyName: "plan_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercise_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_exercises_plan_day_id_fkey"
            columns: ["plan_day_id"]
            isOneToOne: false
            referencedRelation: "plan_days"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string
          id: string
          role: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name: string
          id: string
          role?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          role?: string
        }
        Relationships: []
      }
      session_sets: {
        Row: {
          actual_reps: number | null
          actual_weight_kg: number | null
          completed: boolean | null
          id: string
          plan_exercise_id: string | null
          set_number: number
          workout_session_id: string | null
        }
        Insert: {
          actual_reps?: number | null
          actual_weight_kg?: number | null
          completed?: boolean | null
          id?: string
          plan_exercise_id?: string | null
          set_number: number
          workout_session_id?: string | null
        }
        Update: {
          actual_reps?: number | null
          actual_weight_kg?: number | null
          completed?: boolean | null
          id?: string
          plan_exercise_id?: string | null
          set_number?: number
          workout_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_sets_plan_exercise_id_fkey"
            columns: ["plan_exercise_id"]
            isOneToOne: false
            referencedRelation: "plan_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_sets_workout_session_id_fkey"
            columns: ["workout_session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_plans: {
        Row: {
          archived: boolean | null
          coach_id: string | null
          created_at: string | null
          description: string | null
          duration_weeks: number | null
          id: string
          name: string
        }
        Insert: {
          archived?: boolean | null
          coach_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_weeks?: number | null
          id?: string
          name: string
        }
        Update: {
          archived?: boolean | null
          coach_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_weeks?: number | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_plans_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          athlete_id: string | null
          athlete_note: string | null
          id: string
          performed_at: string | null
          plan_assignment_id: string | null
          plan_day_id: string | null
        }
        Insert: {
          athlete_id?: string | null
          athlete_note?: string | null
          id?: string
          performed_at?: string | null
          plan_assignment_id?: string | null
          plan_day_id?: string | null
        }
        Update: {
          athlete_id?: string | null
          athlete_note?: string | null
          id?: string
          performed_at?: string | null
          plan_assignment_id?: string | null
          plan_day_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_plan_assignment_id_fkey"
            columns: ["plan_assignment_id"]
            isOneToOne: false
            referencedRelation: "plan_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_plan_day_id_fkey"
            columns: ["plan_day_id"]
            isOneToOne: false
            referencedRelation: "plan_days"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      athlete_can_read_exercise: {
        Args: { _exercise: string }
        Returns: boolean
      }
      athlete_can_read_plan: { Args: { _plan: string }; Returns: boolean }
      athlete_can_read_plan_day: {
        Args: { _plan_day: string }
        Returns: boolean
      }
      athlete_owns_session: { Args: { _session: string }; Returns: boolean }
      coach_can_read_assignment: {
        Args: { _assignment: string }
        Returns: boolean
      }
      coach_can_read_session: { Args: { _session: string }; Returns: boolean }
      coach_owns_plan: { Args: { _plan: string }; Returns: boolean }
      coach_owns_plan_day: { Args: { _plan_day: string }; Returns: boolean }
      is_coach_of: { Args: { _athlete: string }; Returns: boolean }
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

