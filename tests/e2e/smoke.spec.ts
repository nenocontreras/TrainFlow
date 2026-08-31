import { expect, test } from "@playwright/test";

test("la home carga y muestra el nombre del producto", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "TrainFlow" })).toBeVisible();
});
