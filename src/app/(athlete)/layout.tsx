import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function AthleteLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole("athlete");
  return <AppShell user={{ fullName: profile.full_name, role: "athlete" }}>{children}</AppShell>;
}
