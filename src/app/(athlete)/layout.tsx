import { requireRole } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";

export default async function AthleteLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole("athlete");
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader fullName={profile.full_name} role="athlete" />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
