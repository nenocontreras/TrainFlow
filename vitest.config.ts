import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "vitest/config";

// Los tests de integración con Supabase (p. ej. tests/unit/rls.test.ts) leen
// credenciales de `.env.test.local` si existe, o `.env.local` como fallback.
// Nunca se commitean.
loadEnv({ path: ".env.test.local" });
loadEnv({ path: ".env.local" });

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // `node` por defecto (rápido). Los tests de componentes de la Fase 1
    // declararán `// @vitest-environment jsdom` por archivo.
    environment: "node",
    include: ["tests/unit/**/*.test.{ts,tsx}", "src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      include: ["src/lib/**/*.ts", "src/hooks/**/*.ts"],
      exclude: ["src/lib/supabase/types.ts", "**/*.d.ts"],
    },
  },
});
