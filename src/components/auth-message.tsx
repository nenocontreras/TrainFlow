import { CircleAlert, CircleCheck, Info, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "error" | "info" | "success";

const STYLES: Record<Variant, { box: string; icon: string; Icon: LucideIcon }> = {
  error: {
    box: "bg-destructive/10 text-destructive",
    icon: "text-destructive",
    Icon: CircleAlert,
  },
  info: {
    box: "bg-muted text-foreground",
    icon: "text-muted-foreground",
    Icon: Info,
  },
  success: {
    box: "bg-primary/10 text-foreground",
    icon: "text-primary",
    Icon: CircleCheck,
  },
};

/** Aviso de formulario con tono según el tipo (un error rojo no es lo mismo que un "revisa tu correo"). */
export function AuthMessage({
  variant = "info",
  children,
}: {
  variant?: Variant;
  children: React.ReactNode;
}) {
  const s = STYLES[variant];
  return (
    <p
      role={variant === "error" ? "alert" : "status"}
      className={cn("flex items-start gap-2 rounded-md px-3 py-2 text-sm", s.box)}
    >
      <s.Icon aria-hidden className={cn("mt-0.5 size-4 shrink-0", s.icon)} />
      <span>{children}</span>
    </p>
  );
}
