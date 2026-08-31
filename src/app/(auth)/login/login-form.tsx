"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Lock, Mail } from "lucide-react";
import { signInAction, type AuthFormState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { IconInput } from "@/components/icon-input";
import { AuthMessage } from "@/components/auth-message";
import { FieldError } from "@/components/field-error";

const initialState: AuthFormState = {};

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <h1 className="text-xl font-bold">Entrar</h1>

      {state.error ? <AuthMessage variant="error">{state.error}</AuthMessage> : null}

      {next ? <input type="hidden" name="next" value={next} /> : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <IconInput
          icon={Mail}
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          required
          autoFocus
        />
        <FieldError messages={state.fieldErrors?.email} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Contraseña</Label>
        <IconInput
          icon={Lock}
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <FieldError messages={state.fieldErrors?.password} />
      </div>

      <Button type="submit" className="mt-1 h-11" disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="text-foreground font-medium underline underline-offset-4">
          Crear cuenta
        </Link>
      </p>
    </form>
  );
}
