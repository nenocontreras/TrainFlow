import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type AthleteProfile = Pick<ProfileRow, "id" | "full_name" | "avatar_url">;

export type CoachAthlete = {
  relationshipId: string;
  since: string | null;
  athlete: AthleteProfile;
};

const ATHLETE_JOIN =
  "athlete:profiles!coach_athlete_relationships_athlete_id_fkey(id, full_name, avatar_url)";

/** Atletas activos del coach actual, por antigüedad de la relación. */
export async function listAthletes(): Promise<CoachAthlete[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coach_athlete_relationships")
    .select(`id, created_at, ${ATHLETE_JOIN}`)
    .eq("status", "active")
    .order("created_at", { ascending: true });
  if (error) throw error;

  return (data ?? [])
    .map((r) => {
      const row = r as { id: string; created_at: string | null; athlete: AthleteProfile | null };
      return row.athlete
        ? { relationshipId: row.id, since: row.created_at, athlete: row.athlete }
        : null;
    })
    .filter((r): r is CoachAthlete => r !== null);
}

/** Un atleta concreto del coach (o `null` si no es suyo). */
export async function getAthlete(athleteId: string): Promise<CoachAthlete | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("coach_athlete_relationships")
    .select(`id, created_at, ${ATHLETE_JOIN}`)
    .eq("athlete_id", athleteId)
    .eq("status", "active")
    .maybeSingle();
  if (!data) return null;
  const row = data as { id: string; created_at: string | null; athlete: AthleteProfile | null };
  return row.athlete
    ? { relationshipId: row.id, since: row.created_at, athlete: row.athlete }
    : null;
}
