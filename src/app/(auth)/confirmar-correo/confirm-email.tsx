"use client";

import Link from "next/link";
import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { resendConfirmationAction, type AuthFormState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { AuthMessage } from "@/components/auth-message";

const initial: AuthFormState = {};

export function ConfirmEmail({ email }: { email: string | null }) {
  const [state, formAction, pending] = useActionState(resendConfirmationAction, initial);

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-primary/10 flex size-12 items-center justify-center rounded-full">
        <MailCheck className="text-primary size-6" />
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold">Confirma tu correo</h1>
        <p className="text-muted-foreground text-sm">
          {email ? (
            <>
              Te enviamos un enlace de activación a{" "}
              <span className="text-foreground font-medium">{email}</span>. Ábrelo para entrar en tu
              cuenta.
            </>
          ) : (
            <>Te enviamos un enlace de activación. Ábrelo para entrar en tu cuenta.</>
          )}
        </p>
      </div>

      {state.error ? <AuthMessage variant="error">{state.error}</AuthMessage> : null}
      {state.info ? <AuthMessage variant="info">{state.info}</AuthMessage> : null}
      {state.success ? <AuthMessage variant="success">{state.success}</AuthMessage> : null}

      {email ? (
        <form action={formAction}>
          <input type="hidden" name="email" value={email} />
          <Button type="submit" variant="outline" className="w-full" disabled={pending}>
            {pending ? "Enviando…" : "Reenviar correo"}
          </Button>
        </form>
      ) : null}

      <p className="text-muted-foreground text-center text-sm">
        ¿Ya lo confirmaste?{" "}
        <Link href="/login" className="text-foreground font-medium underline underline-offset-4">
          Entrar
        </Link>
      </p>
    </div>
  );
}
