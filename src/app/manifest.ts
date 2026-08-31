import type { MetadataRoute } from "next";

// Stub mínimo. La configuración PWA completa (íconos, screenshots, service
// worker, estrategia offline) es la Fase 5 del SPEC.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TrainFlow",
    short_name: "TrainFlow",
    description: "Coaching de entrenamiento físico.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [],
  };
}
