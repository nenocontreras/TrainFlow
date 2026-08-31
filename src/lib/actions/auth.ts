"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import { isRole, landingPathFor } from "@/types";

export type AuthFormState = {
  error?: string;
  info?: string;
  success?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function signInAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: "Email o contraseña incorrectos." };
  }

  const { data } = await supabase.auth.getUser();
  const role = data.user?.user_metadata?.role;
  const next = String(formData.get("next") ?? "");
  redirect(next && next.startsWith("/") ? next : landingPathFor(isRole(role) ? role : "athlete"));
}

export async function signUpAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName, role: parsed.data.role },
    },
  });

  if (error) {
    return {
      error:
        error.code === "user_already_exists" || error.message.includes("already")
          ? "Ya existe una cuenta con ese email."
          : "No se pudo crear la cuenta. Inténtalo de nuevo.",
    };
  }

  // Si el proyecto exige confirmación por email, no hay sesión todavía:
  // llevamos a una pantalla dedicada (no es un error).
  if (!data.session) {
    redirect(`/confirmar-correo?email=${encodeURIComponent(parsed.data.email)}`);
  }

  redirect(landingPathFor(parsed.data.role));
}

export async function resendConfirmationAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = z.string().email().safeParse(formData.get("email"));
  if (!email.success) return { error: "Email no válido." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email: email.data });
  // No revelamos si el email existe o no.
  if (error && !/rate limit/i.test(error.message)) {
    return { error: "No se pudo reenviar el correo. Inténtalo en un momento." };
  }
  if (error) return { info: "Espera un momento antes de volver a pedir el correo." };
  return { success: "Correo reenviado. Revisa tu bandeja de entrada y el spam." };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
