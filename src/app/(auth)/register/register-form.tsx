"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Dumbbell, Users } from "lucide-react";
import { signUpAction, type AuthFormState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

const initialState: AuthFormState = {};

const ROLE_OPTIONS: { value: Role; label: string; hint: string; icon: typeof Dumbbell }[] = [
  {
    value: "athlete",
    label: "Soy atleta",
    hint: "Sigo un plan y registro mi progreso",
    icon: Dumbbell,
  },
  { value: "coach", label: "Soy coach", hint: "Diseño planes y superviso atletas", icon: Users },
];

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);
  const [role, setRole] = useState<Role>("athlete");

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <h1 className="text-xl font-bold">Crear cuenta</h1>

      {state.error ? (
        <p role="alert" className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
          {state.error}
        </p>
      ) : null}

      <input type="hidden" name="role" value={role} />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">¿Cómo vas a usar TrainFlow?</legend>
        <div className="grid grid-cols-2 gap-2">
          {ROLE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const selected = role === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRole(opt.value)}
                aria-pressed={selected}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors",
                  selected ? "border-primary bg-primary/10" : "border-border hover:bg-muted",
                )}
              >
                <Icon className="size-5" aria-hidden />
                <span className="text-sm font-semibold">{opt.label}</span>
                <span className="text-muted-foreground text-xs">{opt.hint}</span>
              </button>
            );
          })}
        </div>
        <FieldError messages={state.fieldErrors?.role} />
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor="fullName">Nombre</Label>
        <Input id="fullName" name="fullName" autoComplete="name" required autoFocus />
        <FieldError messages={state.fieldErrors?.fullName} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        <FieldError messages={state.fieldErrors?.email} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
        <FieldError messages={state.fieldErrors?.password} />
        <p className="text-muted-foreground text-xs">Mínimo 8 caracteres.</p>
      </div>

      <Button type="submit" className="mt-1 h-11" disabled={pending}>
        {pending ? "Creando…" : "Crear cuenta"}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-foreground font-medium underline underline-offset-4">
          Entrar
        </Link>
      </p>
    </form>
  );
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-destructive text-sm">{messages[0]}</p>;
}
