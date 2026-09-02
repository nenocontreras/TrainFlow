import { defaultCache } from "@serwist/next/worker";
import {
  NetworkOnly,
  type PrecacheEntry,
  type RuntimeCaching,
  type SerwistGlobalConfig,
} from "serwist";
import { Serwist } from "serwist";

// `injectionPoint` — Serwist reemplaza `self.__SW_MANIFEST` por el manifiesto de
// precache real al compilar.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Nunca cachear Supabase (Auth, PostgREST): siempre a red. Va antes que
// `defaultCache` para ganar el match.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const runtimeCaching: RuntimeCaching[] = [
  ...(supabaseUrl
    ? [
        {
          matcher: ({ url }: { url: URL }) => url.origin === new URL(supabaseUrl).origin,
          handler: new NetworkOnly(),
        },
      ]
    : []),
  ...defaultCache,
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  // Sin navigationPreload: con conexión intermitente el preload que falla puede
  // dejar la navegación en ERR_FAILED en vez de caer a caché / al fallback.
  navigationPreload: false,
  runtimeCaching,
  // Sin conexión: una navegación que falla cae a la página estática
  // /sin-conexion (precacheada). Las páginas ya visitadas (p. ej. "Hoy") las
  // sirve la estrategia NetworkFirst de `defaultCache` desde caché.
  fallbacks: {
    entries: [
      {
        url: "/sin-conexion",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

serwist.addEventListeners();
