import type { Metadata } from "next";
import { ConfirmEmail } from "./confirm-email";

export const metadata: Metadata = { title: "Confirma tu correo" };

export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  const clean = email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? email : null;
  return <ConfirmEmail email={clean} />;
}
