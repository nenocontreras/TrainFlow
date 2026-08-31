import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser, landingPathFor } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await getSessionUser();
  if (session) redirect(landingPathFor(session.profile.role));

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-5 py-10">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">TrainFlow</h1>
        <p className="text-muted-foreground mt-2">
          Planes de entrenamiento de tu coach. Registra cada serie, mira tu progreso.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <Button asChild className="h-11">
          <Link href="/register">Crear cuenta</Link>
        </Button>
        <Button asChild variant="outline" className="h-11">
          <Link href="/login">Ya tengo cuenta</Link>
        </Button>
      </div>
    </main>
  );
}
