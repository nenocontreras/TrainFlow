"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Dumbbell,
  History,
  LayoutDashboard,
  ListChecks,
  type LucideIcon,
} from "lucide-react";
import { signOutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  coach: [
    { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
    { href: "/planes", label: "Planes", icon: ListChecks },
    { href: "/ejercicios", label: "Ejercicios", icon: Dumbbell },
  ],
  athlete: [
    { href: "/hoy", label: "Hoy", icon: CalendarDays },
    { href: "/historial", label: "Historial", icon: History },
  ],
};

const ROLE_LABEL: Record<Role, string> = { coach: "Coach", athlete: "Atleta" };

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  user,
  children,
}: {
  user: { fullName: string; role: Role };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const nav = NAV_BY_ROLE[user.role];

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_1fr]">
      {/* Sidebar — desktop */}
      <aside className="bg-card sticky top-0 hidden h-dvh flex-col border-r lg:flex">
        <div className="flex h-14 items-center px-5">
          <span className="font-display text-lg font-extrabold tracking-tight">TrainFlow</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive(pathname, href)
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t p-3">
          <p className="truncate px-3 text-sm font-medium">{user.fullName}</p>
          <p className="text-muted-foreground px-3 text-xs">{ROLE_LABEL[user.role]}</p>
          <form action={signOutAction} className="mt-2">
            <Button type="submit" variant="ghost" size="sm" className="w-full justify-start px-3">
              Cerrar sesión
            </Button>
          </form>
        </div>
      </aside>

      {/* Top bar — mobile */}
      <header className="bg-background/80 sticky top-0 z-20 flex h-14 items-center justify-between border-b px-4 backdrop-blur lg:hidden">
        <span className="font-display text-lg font-extrabold tracking-tight">TrainFlow</span>
        <form action={signOutAction}>
          <Button type="submit" variant="ghost" size="sm">
            Salir
          </Button>
        </form>
      </header>

      <div className="flex min-w-0 flex-col">
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-5 pb-24 lg:max-w-5xl lg:px-8 lg:py-8 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Bottom nav — mobile */}
      <nav className="bg-card fixed inset-x-0 bottom-0 z-20 flex border-t lg:hidden">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[0.7rem] font-medium transition-colors",
              isActive(pathname, href) ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
