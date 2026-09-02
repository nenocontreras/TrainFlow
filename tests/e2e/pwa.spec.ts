import { expect, test } from "@playwright/test";

test.describe("Fase 5: PWA", () => {
  test("el manifest es válido e instalable", async ({ request }) => {
    const res = await request.get("/manifest.webmanifest");
    expect(res.ok()).toBeTruthy();

    const m = (await res.json()) as {
      name?: string;
      display?: string;
      start_url?: string;
      icons?: { sizes: string; purpose?: string }[];
    };
    expect(m.name).toContain("TrainFlow");
    expect(m.display).toBe("standalone");
    expect(m.start_url).toBe("/");

    const sizes = (m.icons ?? []).map((i) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
    expect((m.icons ?? []).some((i) => i.purpose === "maskable")).toBeTruthy();
  });

  test("los íconos del manifest se sirven", async ({ request }) => {
    for (const name of ["icon-192.png", "icon-512.png", "maskable-512.png"]) {
      const res = await request.get(`/icons/${name}`);
      expect(res.ok(), name).toBeTruthy();
      expect(res.headers()["content-type"]).toContain("image/png");
    }
  });

  test("la página de sin conexión se muestra", async ({ page }) => {
    await page.goto("/sin-conexion");
    await expect(page.getByRole("heading", { name: "Sin conexión" })).toBeVisible();
  });

  test("el service worker se registra, se activa y precachea el app-shell", async ({
    page,
    request,
  }) => {
    // El script del SW se sirve con el content-type correcto.
    const sw = await request.get("/sw.js");
    expect(sw.ok()).toBeTruthy();
    expect(sw.headers()["content-type"]).toMatch(/javascript/);

    await page.goto("/");

    // El SW se registra y llega a "activated" (puede pasar por "activating").
    await page.waitForFunction(
      async () => (await navigator.serviceWorker?.ready)?.active?.state === "activated",
      null,
      { timeout: 20_000 },
    );

    // Y toma el control de la página (clientsClaim).
    await page.waitForFunction(() => navigator.serviceWorker?.controller != null, null, {
      timeout: 20_000,
    });

    // Hay una caché de precache poblada con el app-shell.
    const precached = await page.evaluate(async () => {
      const names = await caches.keys();
      let total = 0;
      for (const n of names) total += (await (await caches.open(n)).keys()).length;
      return total;
    });
    expect(precached).toBeGreaterThan(0);
  });
});
