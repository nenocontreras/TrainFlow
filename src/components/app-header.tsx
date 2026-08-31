import { signOutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import type { Role } from "@/types";

const ROLE_LABEL: Record<Role, string> = { coach: "Coach", athlete: "Atleta" };

export function AppHeader({ fullName, role }: { fullName: string; role: Role }) {
  return (
    <header className="bg-background/80 sticky top-0 z-10 border-b backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between gap-3 px-4">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-lg font-extrabold tracking-tight">TrainFlow</span>
          <span className="text-muted-foreground text-xs">{ROLE_LABEL[role]}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground hidden text-sm sm:inline">{fullName}</span>
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" size="sm">
              Salir
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
