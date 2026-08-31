import { expect, test } from "@playwright/test";
import { E2E_PASSWORD, E2E_READY, E2E_USERS } from "./fixtures";

test("la home muestra las acciones de entrada", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Crear cuenta" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ya tengo cuenta" })).toBeVisible();
});

test("una ruta protegida sin sesión redirige a /login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
});

test("el login muestra los campos con icono", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Contraseña")).toBeVisible();
  // los iconos guía se renderizan dentro del contenedor del campo
  await expect(page.locator("form .relative svg").first()).toBeVisible();
});

test("la pantalla de confirmar correo se muestra bien (no como error)", async ({ page }) => {
  await page.goto("/confirmar-correo?email=ana%40mail.com");
  await expect(page.getByRole("heading", { name: "Confirma tu correo" })).toBeVisible();
  await expect(page.getByText("ana@mail.com")).toBeVisible();
  await expect(page.getByRole("button", { name: "Reenviar correo" })).toBeVisible();
  // El aviso no debe presentarse como error (rojo / role=alert) dentro del panel.
  await expect(page.locator("main [role='alert']")).toHaveCount(0);
});

test.describe("con credenciales de Supabase", () => {
  test.skip(!E2E_READY, "requiere NEXT_PUBLIC_SUPABASE_URL / keys");

  test("el coach entra y aterriza en el dashboard; luego sale", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(E2E_USERS.coach);
    await page.getByLabel("Contraseña").fill(E2E_PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: /Hola,/ })).toBeVisible();

    await page.getByRole("button", { name: "Salir" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("el atleta aterriza en /hoy", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(E2E_USERS.athlete);
    await page.getByLabel("Contraseña").fill(E2E_PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/hoy$/);
  });

  test("un atleta no puede entrar a /dashboard (redirige a /hoy)", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(E2E_USERS.athlete);
    await page.getByLabel("Contraseña").fill(E2E_PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/hoy$/);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/hoy$/);
  });
});
