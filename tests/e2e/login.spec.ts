import { expect, test } from "@playwright/test";

test.describe("Authentication", () => {
  test("unauthenticated visitor is redirected to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login(\?.*)?$/);
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  });

  test("admin can sign in and reach the dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("admin@contact.local");
    await page.getByLabel(/password/i).fill("ChangeMe!2026");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText(/welcome/i)).toBeVisible();
  });

  test("invalid credentials show an error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("admin@contact.local");
    await page.getByLabel(/password/i).fill("WrongPassword!");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByRole("alert")).toBeVisible();
  });
});
