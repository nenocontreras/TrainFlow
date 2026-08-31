"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, LayoutDashboard, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/planes", label: "Planes", icon: ListChecks },
  { href: "/ejercicios", label: "Ejercicios", icon: Dumbbell },
];

export function CoachNav() {
  const pathname = usePathname();
  return (
    <nav className="border-b">
      <div className="mx-auto flex w-full max-w-2xl gap-1 px-2">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground border-transparent",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
