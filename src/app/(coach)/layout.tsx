import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole("coach");
  return <AppShell user={{ fullName: profile.full_name, role: "coach" }}>{children}</AppShell>;
}
