import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

test.describe("War Room", () => {
  test("should display War Room button in weekly header", async ({ page }) => {
    // Create test account and login directly to weekly page
    const userData = await createTestAccount({
      page,
      callbackURL: "/app/weekly",
    });

    // Wait for weekly page to load
    await page.waitForURL(/\/app\/weekly/, { timeout: 30000 });
    await page.waitForLoadState("networkidle");
    await page.waitForLoadState("domcontentloaded");

    // Verify War Room button is visible
    const warRoomButton = page.getByRole("button", { name: /war room/i });
    await expect(warRoomButton).toBeVisible({ timeout: 10000 });

    // Clean up - delete user
    const user = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (user) {
      await prisma.user.delete({
        where: { id: user.id },
      });
    }
  });

  test("should open War Room modal on button click", async ({ page }) => {
    // Create test account and login directly to weekly page
    const userData = await createTestAccount({
      page,
      callbackURL: "/app/weekly",
    });

    // Wait for weekly page to load
    await page.waitForURL(/\/app\/weekly/, { timeout: 30000 });
    await page.waitForLoadState("networkidle");
    await page.waitForLoadState("domcontentloaded");

    // Click War Room button
    const warRoomButton = page.getByRole("button", { name: /war room/i });
    await expect(warRoomButton).toBeVisible({ timeout: 10000 });
    await warRoomButton.click();

    // Verify modal is visible with correct title
    // EN: "War Room - Week of {date}", FR: "War Room - Semaine du {date}"
    await expect(page.getByRole("heading", { name: /war room/i })).toBeVisible({
      timeout: 10000,
    });

    // Verify modal structure - header, content areas, footer
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Verify footer buttons are visible
    // EN: "Cancel", FR: "Annuler"
    await expect(
      page.getByRole("button", { name: /cancel|annuler/i }),
    ).toBeVisible();
    // EN: "Confirm", FR: "Confirmer"
    await expect(
      page.getByRole("button", { name: /confirm|confirmer/i }),
    ).toBeVisible();
    // EN: "Generate Planning", FR: "Générer le planning"
    await expect(
      page.getByRole("button", { name: /generate planning|générer/i }),
    ).toBeVisible();

    // Clean up - delete user
    const user = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (user) {
      await prisma.user.delete({
        where: { id: user.id },
      });
    }
  });

  test("should display stats in War Room modal", async ({ page }) => {
    // Create test account and login directly to weekly page
    const userData = await createTestAccount({
      page,
      callbackURL: "/app/weekly",
    });

    // Wait for weekly page to load
    await page.waitForURL(/\/app\/weekly/, { timeout: 30000 });
    await page.waitForLoadState("networkidle");
    await page.waitForLoadState("domcontentloaded");

    // Click War Room button
    const warRoomButton = page.getByRole("button", { name: /war room/i });
    await expect(warRoomButton).toBeVisible({ timeout: 10000 });
    await warRoomButton.click();

    // Wait for modal to be visible
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });

    // Verify stats section is visible (CardTitle is a div, not heading)
    // EN: "Weekly Retrospective", FR: "Rétrospective hebdomadaire"
    await expect(
      page.getByText(/weekly retrospective|rétrospective hebdomadaire/i),
    ).toBeVisible({ timeout: 10000 });

    // Verify stat labels are visible (check for any of the expected labels)
    // EN: "Tasks Completed", "Total Hours", "Rescue Slots", "Skipped Tasks", "Focus Quality", "Energy Level"
    // FR: "Tâches complétées", "Heures totales", "Créneaux secours", "Tâches ignorées", "Qualité focus", "Niveau énergie"
    await Promise.all([
      expect(
        page.getByText(/tasks completed|tâches complétées/i).first(),
      ).toBeVisible({ timeout: 10000 }),
      expect(page.getByText(/total hours|heures totales/i).first()).toBeVisible(
        { timeout: 10000 },
      ),
      expect(page.getByText(/rescue|secours/i).first()).toBeVisible({
        timeout: 10000,
      }),
    ]);

    // Verify planning placeholder is visible inside the modal (CardTitle is a div, not heading)
    // EN: "Weekly Planning", FR: "Planification hebdomadaire"
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByText(/weekly planning|planification hebdomadaire/i),
    ).toBeVisible();

    // Clean up - delete user
    const user = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (user) {
      await prisma.user.delete({
        where: { id: user.id },
      });
    }
  });

  test("should close War Room modal on Cancel button click", async ({
    page,
  }) => {
    // Create test account and login directly to weekly page
    const userData = await createTestAccount({
      page,
      callbackURL: "/app/weekly",
    });

    // Wait for weekly page to load
    await page.waitForURL(/\/app\/weekly/, { timeout: 30000 });
    await page.waitForLoadState("networkidle");
    await page.waitForLoadState("domcontentloaded");

    // Click War Room button to open modal
    const warRoomButton = page.getByRole("button", { name: /war room/i });
    await expect(warRoomButton).toBeVisible({ timeout: 10000 });
    await warRoomButton.click();

    // Wait for modal to be visible
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });

    // Click Cancel button
    const cancelButton = page.getByRole("button", { name: /cancel|annuler/i });
    await cancelButton.click();

    // Verify modal is closed
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });

    // Clean up - delete user
    const user = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (user) {
      await prisma.user.delete({
        where: { id: user.id },
      });
    }
  });

  test("should close War Room modal on X button click", async ({ page }) => {
    // Create test account and login directly to weekly page
    const userData = await createTestAccount({
      page,
      callbackURL: "/app/weekly",
    });

    // Wait for weekly page to load
    await page.waitForURL(/\/app\/weekly/, { timeout: 30000 });
    await page.waitForLoadState("networkidle");
    await page.waitForLoadState("domcontentloaded");

    // Click War Room button to open modal
    const warRoomButton = page.getByRole("button", { name: /war room/i });
    await expect(warRoomButton).toBeVisible({ timeout: 10000 });
    await warRoomButton.click();

    // Wait for modal to be visible
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });

    // Click X close button in modal header (first close button)
    const closeButton = page.getByLabel(/close|fermer/i).first();
    await closeButton.click();

    // Verify modal is closed
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });

    // Clean up - delete user
    const user = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (user) {
      await prisma.user.delete({
        where: { id: user.id },
      });
    }
  });

  test("should close War Room modal on Confirm button click", async ({
    page,
  }) => {
    // Create test account and login directly to weekly page
    const userData = await createTestAccount({
      page,
      callbackURL: "/app/weekly",
    });

    // Wait for weekly page to load
    await page.waitForURL(/\/app\/weekly/, { timeout: 30000 });
    await page.waitForLoadState("networkidle");
    await page.waitForLoadState("domcontentloaded");

    // Click War Room button to open modal
    const warRoomButton = page.getByRole("button", { name: /war room/i });
    await expect(warRoomButton).toBeVisible({ timeout: 10000 });
    await warRoomButton.click();

    // Wait for modal to be visible
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });

    // Click Confirm button
    const confirmButton = page.getByRole("button", {
      name: /confirm|confirmer/i,
    });
    await confirmButton.click();

    // Verify modal is closed
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });

    // Clean up - delete user
    const user = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (user) {
      await prisma.user.delete({
        where: { id: user.id },
      });
    }
  });

  test("should be responsive on mobile viewport", async ({ page }) => {
    // Create test account and login directly to weekly page
    const userData = await createTestAccount({
      page,
      callbackURL: "/app/weekly",
    });

    // Wait for weekly page to load
    await page.waitForURL(/\/app\/weekly/, { timeout: 30000 });
    await page.waitForLoadState("networkidle");
    await page.waitForLoadState("domcontentloaded");

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Wait for layout to adjust
    await page.waitForTimeout(500);

    // Click War Room button
    const warRoomButton = page.getByRole("button", { name: /war room/i });
    await expect(warRoomButton).toBeVisible({ timeout: 10000 });
    await warRoomButton.click();

    // Wait for modal to be visible
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });

    // Verify modal title is visible on mobile
    await expect(
      page.getByRole("heading", { name: /war room/i }),
    ).toBeVisible();

    // Verify stats section is visible on mobile (CardTitle is a div, not heading)
    await expect(
      page.getByText(/weekly retrospective|rétrospective hebdomadaire/i),
    ).toBeVisible({ timeout: 10000 });

    // Verify footer buttons are visible and accessible on mobile
    await expect(
      page.getByRole("button", { name: /cancel|annuler/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /confirm|confirmer/i }),
    ).toBeVisible();

    // Close modal using Cancel
    await page.getByRole("button", { name: /cancel|annuler/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });

    // Clean up - delete user
    const user = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (user) {
      await prisma.user.delete({
        where: { id: user.id },
      });
    }
  });
});
