// Este archivo se REGENERA con `pnpm db:types` (supabase gen types typescript).
// No editar a mano (sección 10 del SPEC).
// Placeholder hasta la primera generación contra el esquema local.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
