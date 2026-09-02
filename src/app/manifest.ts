import type { MetadataRoute } from "next";

// Web App Manifest (SPEC §7.8). Los íconos se generan con
// `pnpm pwa:icons` (scripts/generate-pwa-icons.mjs) hacia public/icons/.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TrainFlow — Coaching de entrenamiento",
    short_name: "TrainFlow",
    description:
      "Sigue tu plan de entrenamiento, registra cada serie desde el móvil y revisa tu progreso.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "es",
    dir: "ltr",
    categories: ["health", "fitness", "sports"],
    background_color: "#151513",
    theme_color: "#151513",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Hoy", short_name: "Hoy", url: "/hoy" },
      { name: "Historial", short_name: "Historial", url: "/historial" },
      { name: "Panel del coach", short_name: "Panel", url: "/dashboard" },
    ],
  };
}
