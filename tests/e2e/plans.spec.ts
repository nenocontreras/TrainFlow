import { expect, test, type Page } from "@playwright/test";
import { E2E_PASSWORD, E2E_READY, E2E_USERS } from "./fixtures";

test.describe("constructor de planes (coach)", () => {
  test.skip(!E2E_READY, "requiere credenciales de Supabase");

  const run = String(Date.now()).slice(-6);
  const EXERCISES = [`Press ${run}`, `Sentadilla ${run}`, `Remo ${run}`];

  async function login(page: Page) {
    await page.goto("/login");
    await page.getByLabel("Email").fill(E2E_USERS.coach);
    await page.getByLabel("Contraseña").fill(E2E_PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  }

  async function createExercise(page: Page, name: string) {
    await page.goto("/ejercicios");
    await page.getByRole("button", { name: "Nuevo" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Nombre").fill(name);
    await dialog.getByRole("button", { name: "Crear" }).click();
    await expect(page.getByText(name, { exact: true })).toBeVisible();
  }

  async function addExerciseToDay(page: Page, dayLabel: string, exercise: string, reps: string) {
    const day = page.locator("section", { hasText: dayLabel }).first();
    await day.getByRole("button", { name: "Añadir ejercicio" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Ejercicio").click();
    await page.getByRole("option", { name: new RegExp(exercise) }).click();
    await dialog.getByLabel("Repeticiones").fill(reps);
    await dialog.getByRole("button", { name: "Añadir" }).click();
    await expect(dialog).toBeHidden();
  }

  test("crea un plan con 2 días y 3 ejercicios por día (DoD §14)", async ({ page }) => {
    await login(page);

    for (const name of EXERCISES) await createExercise(page, name);

    await page.goto("/planes/nuevo");
    await page.getByLabel("Nombre del plan").fill(`Plan ${run}`);
    await page.getByRole("button", { name: "Crear plan" }).click();
    await expect(page).toHaveURL(/\/planes\/[0-9a-f-]+$/);

    for (const label of [`Día 1 ${run}`, `Día 2 ${run}`]) {
      await page.getByLabel("Nombre del día").fill(label);
      await page.getByRole("button", { name: "Añadir día" }).click();
      await expect(page.getByRole("heading", { name: label })).toBeVisible();
    }

    for (const label of [`Día 1 ${run}`, `Día 2 ${run}`]) {
      for (const ex of EXERCISES) {
        await addExerciseToDay(page, label, ex, "8-10");
      }
    }

    // Cada día tiene sus 3 ejercicios.
    for (const label of [`Día 1 ${run}`, `Día 2 ${run}`]) {
      const day = page.locator("section", { hasText: label }).first();
      await expect(day.locator("ol > li")).toHaveCount(3);
    }
  });
});
