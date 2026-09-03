import { expect, test, type Page } from "@playwright/test";
import { E2E_PASSWORD, E2E_READY, E2E_USERS, resetE2ECoachData } from "./fixtures";

test.describe("Fases 3-4: asignación, vista Hoy y progreso del coach", () => {
  test.skip(!E2E_READY, "requiere credenciales de Supabase");

  // Datos limpios en cada intento (incluidos los reintentos): este flujo crea
  // sesión + mensajes y un reintento sobre datos sucios rompía en cascada.
  test.beforeEach(async () => {
    await resetE2ECoachData();
  });

  const run = String(Date.now()).slice(-6);

  async function login(page: Page, email: string) {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Contraseña").fill(E2E_PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();
  }

  async function logout(page: Page) {
    await page.getByRole("button", { name: "Salir" }).click();
    await page.waitForURL(/\/login$/);
  }

  test("el coach vincula un atleta, le asigna un plan y el atleta registra una serie", async ({
    page,
  }) => {
    test.setTimeout(120_000); // flujo largo end-to-end en una máquina lenta

    // --- Coach: ejercicio + plan de 1 día -------------------------------------
    await login(page, E2E_USERS.coach);
    await expect(page).toHaveURL(/\/dashboard$/);

    const exName = `Sentadilla ${run}`;
    await page.goto("/ejercicios");
    await page.getByRole("button", { name: "Nuevo" }).click();
    await page.getByRole("dialog").getByLabel("Nombre").fill(exName);
    await page.getByRole("dialog").getByRole("button", { name: "Crear" }).click();
    await expect(page.getByText(exName, { exact: true })).toBeVisible();

    await page.goto("/planes/nuevo");
    await page.getByLabel("Nombre del plan").fill(`Plan ${run}`);
    await page.getByRole("button", { name: "Crear plan" }).click();
    await expect(page).toHaveURL(/\/planes\/[0-9a-f-]+$/);

    await page.getByLabel("Nombre del día").fill(`Día 1 ${run}`);
    await page.getByRole("button", { name: "Añadir día" }).click();
    const day = page.locator("section", { hasText: `Día 1 ${run}` }).first();
    await day.getByRole("button", { name: "Añadir ejercicio" }).click();
    const exDialog = page.getByRole("dialog");
    await exDialog.getByLabel("Ejercicio").click();
    await page.getByRole("option", { name: new RegExp(exName) }).click();
    await exDialog.getByLabel("Repeticiones").fill("5");
    await exDialog.getByRole("button", { name: "Añadir" }).click();
    await expect(exDialog).toBeHidden();

    // --- Coach: vincular atleta y asignar el plan ---------------------------
    await page.goto("/atletas");
    await page.getByRole("button", { name: "Añadir" }).click();
    await page.getByRole("dialog").getByLabel("Email del atleta").fill(E2E_USERS.athlete);
    await page.getByRole("dialog").getByRole("button", { name: "Vincular" }).click();
    await expect(page.getByRole("link", { name: /E2E athlete/ })).toBeVisible();

    await page.getByRole("link", { name: /E2E athlete/ }).click();
    await expect(page).toHaveURL(/\/atletas\/[0-9a-f-]+$/);
    await page.getByRole("button", { name: "Asignar plan" }).click();
    const assignDialog = page.getByRole("dialog");
    await assignDialog.getByLabel("Plan").selectOption({ label: `Plan ${run}` });
    await assignDialog.getByRole("button", { name: "Asignar" }).click();
    await expect(page.getByText(`Plan ${run}`).first()).toBeVisible();

    await logout(page);

    // --- Atleta: Hoy -> empezar -> registrar una serie --------------------
    await login(page, E2E_USERS.athlete);
    await expect(page).toHaveURL(/\/hoy$/);
    await expect(page.getByRole("heading", { name: "Hoy te toca" })).toBeVisible();

    // HomeToday: la tarjeta de hoy con el ejercicio y el botón de empezar
    await expect(page.getByText(exName)).toBeVisible();
    await page.getByRole("button", { name: "Empezar sesión" }).click();

    // FocusSession: un ejercicio a la vez, cifras grandes
    await expect(page.getByRole("heading", { name: exName })).toBeVisible();
    await expect(page.getByText(/0\/\d+ series/)).toBeVisible();

    // primera serie: +peso x2, +reps, "serie hecha"
    await page.getByRole("button", { name: "+2.5" }).click();
    await page.getByRole("button", { name: "+2.5" }).click();
    await page.getByRole("button", { name: "Más repeticiones" }).click();
    await page.getByRole("button", { name: /Serie hecha/ }).click();

    // el descanso arranca a pantalla completa -> saltarlo
    await page.getByRole("button", { name: "Saltar descanso" }).click();
    await expect(page.getByText(/1\/\d+ series/)).toBeVisible();

    // terminar
    await page.getByLabel("Nota (opcional)").fill("Test e2e");
    await page.getByRole("button", { name: "Terminar entrenamiento" }).click();
    await expect(page.getByRole("button", { name: "Guardar cambios" })).toBeVisible();

    // --- Atleta: historial ------------------------------------------------
    await page.goto("/historial");
    await expect(page.getByText(`Día 1 ${run}`)).toBeVisible();
    await expect(page.getByText("Test e2e")).toBeVisible();

    // --- Coach: panel de progreso del atleta (Fase 4) --------------------
    await logout(page);
    await login(page, E2E_USERS.coach);
    await expect(page).toHaveURL(/\/dashboard$/);
    // el panel muestra actividad reciente del atleta
    await expect(page.getByText("Actividad de atletas")).toBeVisible();

    await page.goto("/atletas");
    await page.getByRole("link", { name: /E2E athlete/ }).click();
    await expect(page).toHaveURL(/\/atletas\/[0-9a-f-]+/);

    // sección de progresión con el ejercicio registrado disponible
    await expect(page.getByRole("heading", { name: "Progresión de carga" })).toBeVisible();
    await expect(page.getByLabel("Ejercicio").locator("option", { hasText: exName })).toHaveCount(
      1,
    );

    // actividad reciente refleja la serie completada
    await expect(page.getByText(`Día 1 ${run}`)).toBeVisible();
    await expect(page.getByText(/1\/\d+ series/)).toBeVisible();

    // --- Coach: buzón de mensajes -> escribe al atleta -------------------
    await page.goto("/mensajes");
    await page.getByRole("link", { name: /E2E athlete/ }).click();
    await expect(page).toHaveURL(/\/mensajes\/[0-9a-f-]+/);
    const note = `Buen trabajo ${run}`;
    await page.getByLabel("Mensaje").fill(note);
    await page.getByRole("button", { name: "Enviar" }).click();
    await expect(page.getByText(note)).toBeVisible();

    // --- Atleta: ve el mensaje del coach --------------------------------
    await logout(page);
    await login(page, E2E_USERS.athlete);
    await expect(page).toHaveURL(/\/hoy$/); // esperar a que la sesión esté lista
    await page.goto("/coach");
    await expect(page.getByText(note)).toBeVisible();
  });
});
