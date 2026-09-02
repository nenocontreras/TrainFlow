import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  // 1 worker: los specs comparten los usuarios e2e (coach/atleta) y su data en
  // Supabase; correr en paralelo hace que un test borre los datos de otro.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  // Máquina de desarrollo lenta: las server actions pueden tardar > 5 s.
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  // Mobile-first (sección 8 del SPEC): el proyecto principal es un viewport de celular.
  projects: [
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: {
    // En CI se construye y sirve. En local se asume `pnpm build` previo
    // (evita reconstruir en cada corrida en máquinas lentas).
    command: process.env.CI ? "pnpm build && pnpm start" : "pnpm start",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: process.env.CI ? 240_000 : 60_000,
  },
});
