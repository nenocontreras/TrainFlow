"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "tf-install-dismissed";

/** Botón "Instalar app" — solo aparece si el navegador ofrece la instalación. */
export function InstallButton({ className }: { className?: string }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      // localStorage no disponible: seguimos, el botón puede mostrarse igual.
    }
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setDeferred(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!deferred) return null;

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "dismissed") {
      try {
        localStorage.setItem(DISMISS_KEY, "1");
      } catch {
        // sin persistencia: se volverá a ofrecer, no pasa nada.
      }
    }
    setDeferred(null);
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={install} className={className}>
      <Download className="size-4" />
      Instalar app
    </Button>
  );
}
