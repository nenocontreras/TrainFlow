import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "vitest/config";

// Los tests de integración con Supabase (p. ej. tests/unit/rls.test.ts) leen
// credenciales de `.env.test.local` si existe, o `.env.local` como fallback.
// Nunca se commitean.
loadEnv({ path: ".env.test.local" });
loadEnv({ path: ".env.local" });

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // `node` por defecto (rápido). Los tests de componentes declaran
    // `// @vitest-environment jsdom` en su cabecera.
    environment: "node",
    include: ["tests/unit/**/*.test.{ts,tsx}", "src/**/*.test.{ts,tsx}"],
    // Un único proceso: evita que el pool de workers agote la RAM en equipos
    // con poca memoria. Los tests son rápidos y en su mayoría de I/O.
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      include: ["src/lib/**/*.ts", "src/hooks/**/*.ts", "src/types/**/*.ts"],
      exclude: ["src/lib/supabase/types.ts", "**/*.d.ts"],
    },
  },
});
