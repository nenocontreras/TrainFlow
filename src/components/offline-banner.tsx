"use client";

import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";

function subscribe(callback: () => void): () => void {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

/** `true` si el navegador cree que hay conexión. SSR y primer render: `true`. */
export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
}

/** Aviso fijo cuando no hay conexión. Se monta en el marco de la app. */
export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;

  return (
    <div
      role="status"
      className="bg-foreground text-background fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 px-4 py-1.5 text-center text-xs font-medium lg:left-60"
    >
      <WifiOff className="size-3.5 shrink-0" aria-hidden />
      Sin conexión — los cambios se guardarán cuando vuelvas a tener señal.
    </div>
  );
}
