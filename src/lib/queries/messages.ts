import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export interface ChatMessage {
  id: string;
  /** El mensaje lo escribió el usuario que está viendo el hilo. */
  mine: boolean;
  text: string;
  sentAt: string;
  quote: string | null;
}

type Client = SupabaseClient<Database>;
type PeerProfile = { id: string; full_name: string } | null;

async function currentUserId(supabase: Client): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

function toChatMessage(
  m: { id: string; sender_id: string; body: string; quote: string | null; sent_at: string },
  me: string,
): ChatMessage {
  return { id: m.id, mine: m.sender_id === me, text: m.body, sentAt: m.sent_at, quote: m.quote };
}

const MESSAGE_COLS = "id, sender_id, body, quote, sent_at";

// --- Atleta ------------------------------------------------------------------

export interface AthleteThread {
  coachId: string;
  coachName: string;
  athleteId: string;
  messages: ChatMessage[];
}

/** Hilo del atleta actual con su coach, o `null` si no tiene coach activo. */
export async function getAthleteThread(): Promise<AthleteThread | null> {
  const supabase = await createClient();
  const me = await currentUserId(supabase);
  if (!me) return null;

  const { data: rel } = await supabase
    .from("coach_athlete_relationships")
    .select("coach_id, coach:profiles!coach_athlete_relationships_coach_id_fkey(id, full_name)")
    .eq("athlete_id", me)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!rel?.coach_id) return null;
  const coach = rel.coach as PeerProfile;

  const { data: rows } = await supabase
    .from("messages")
    .select(MESSAGE_COLS)
    .eq("coach_id", rel.coach_id)
    .eq("athlete_id", me)
    .order("sent_at", { ascending: true });

  return {
    coachId: rel.coach_id,
    coachName: coach?.full_name ?? "Tu coach",
    athleteId: me,
    messages: (rows ?? []).map((m) => toChatMessage(m, me)),
  };
}

// --- Coach ------------------------------------------------------------------

export interface CoachThreadSummary {
  athleteId: string;
  athleteName: string;
  lastText: string | null;
  lastAt: string | null;
  /** El último mensaje del hilo lo escribió el atleta (señal blanda de "pendiente"). */
  lastFromAthlete: boolean;
}

/** Buzón del coach: sus atletas activos con el último mensaje de cada hilo. */
export async function listCoachThreads(): Promise<CoachThreadSummary[]> {
  const supabase = await createClient();
  const me = await currentUserId(supabase);
  if (!me) return [];

  const { data: rels } = await supabase
    .from("coach_athlete_relationships")
    .select("athlete:profiles!coach_athlete_relationships_athlete_id_fkey(id, full_name)")
    .eq("coach_id", me)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  const athletes = (rels ?? [])
    .map((r) => r.athlete as PeerProfile)
    .filter((a): a is { id: string; full_name: string } => a !== null);
  if (athletes.length === 0) return [];

  const { data: msgs } = await supabase
    .from("messages")
    .select("athlete_id, sender_id, body, sent_at")
    .eq("coach_id", me)
    .order("sent_at", { ascending: false });

  const lastByAthlete = new Map<string, { body: string; sent_at: string; sender_id: string }>();
  for (const m of msgs ?? []) {
    if (!lastByAthlete.has(m.athlete_id)) {
      lastByAthlete.set(m.athlete_id, { body: m.body, sent_at: m.sent_at, sender_id: m.sender_id });
    }
  }

  return athletes.map((a) => {
    const last = lastByAthlete.get(a.id);
    return {
      athleteId: a.id,
      athleteName: a.full_name,
      lastText: last?.body ?? null,
      lastAt: last?.sent_at ?? null,
      lastFromAthlete: last ? last.sender_id !== me : false,
    };
  });
}

export interface CoachThread {
  athleteId: string;
  athleteName: string;
  messages: ChatMessage[];
}

/** Hilo del coach con un atleta suyo, o `null` si no es su atleta activo. */
export async function getCoachThread(athleteId: string): Promise<CoachThread | null> {
  const supabase = await createClient();
  const me = await currentUserId(supabase);
  if (!me) return null;

  const { data: rel } = await supabase
    .from("coach_athlete_relationships")
    .select("athlete:profiles!coach_athlete_relationships_athlete_id_fkey(id, full_name)")
    .eq("coach_id", me)
    .eq("athlete_id", athleteId)
    .eq("status", "active")
    .maybeSingle();
  const athlete = (rel?.athlete ?? null) as PeerProfile;
  if (!athlete) return null;

  const { data: rows } = await supabase
    .from("messages")
    .select(MESSAGE_COLS)
    .eq("coach_id", me)
    .eq("athlete_id", athleteId)
    .order("sent_at", { ascending: true });

  return {
    athleteId,
    athleteName: athlete.full_name,
    messages: (rows ?? []).map((m) => toChatMessage(m, me)),
  };
}
