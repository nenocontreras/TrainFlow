import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { listExercises } from "@/lib/queries/exercises";
import { ExerciseLibrary } from "./exercise-library";

export const metadata: Metadata = { title: "Ejercicios" };

export default async function ExercisesPage() {
  await requireRole("coach");
  const exercises = await listExercises();
  return <ExerciseLibrary exercises={exercises} />;
}
