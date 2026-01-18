import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

test.describe("Weekly Planning", () => {
  test("should display weekly page correctly", async ({ page }) => {
    // Create test account and login directly to weekly page
    const userData = await createTestAccount({
      page,
      callbackURL: "/app/weekly",
    });

    // Wait for weekly page to load
    await page.waitForURL(/\/app\/weekly/, { timeout: 30000 });
    await page.waitForLoadState("networkidle");

    // Verify we're on the weekly page
    expect(page.url()).toContain("/weekly");

    // Verify page title is visible (supports both EN and FR)
    // EN: "Weekly Planning", FR: "Planification Hebdomadaire"
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 10000,
    });

    // Verify page description is visible (check for h1 element exists)
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();

    // Verify week header is displayed (EN: "Week of", FR: "Semaine du")
    await expect(
      page.getByRole("heading", { level: 2, name: /week of|semaine du/i }),
    ).toBeVisible();

    // Verify navigation buttons are visible (using aria-label which stays consistent)
    await expect(page.locator("button[aria-label]").first()).toBeVisible();

    // Verify War Room button is visible
    await expect(page.getByRole("button", { name: /war room/i })).toBeVisible();

    // Verify grid displays all 7 days
    await expect(page.getByText(/mon/i)).toBeVisible();
    await expect(page.getByText(/tue/i)).toBeVisible();
    await expect(page.getByText(/wed/i)).toBeVisible();
    await expect(page.getByText(/thu/i)).toBeVisible();
    await expect(page.getByText(/fri/i)).toBeVisible();
    await expect(page.getByText(/sat/i)).toBeVisible();
    await expect(page.getByText(/sun/i)).toBeVisible();

    // Verify time slots are displayed (at least 08:00 and 19:00)
    await expect(page.getByText("08:00")).toBeVisible();
    await expect(page.getByText("19:00")).toBeVisible();

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

  test("should navigate between weeks", async ({ page }) => {
    // Create test account and login directly to weekly page
    const userData = await createTestAccount({
      page,
      callbackURL: "/app/weekly",
    });

    await page.waitForURL(/\/app\/weekly/, { timeout: 30000 });
    await page.waitForLoadState("networkidle");

    // Get the week header and verify it's visible
    const weekHeader = page.getByRole("heading", {
      level: 2,
      name: /week of|semaine du/i,
    });
    await expect(weekHeader).toBeVisible({ timeout: 10000 });

    // Get the week date range element - it's the p element next to h2 in the header
    const weekRangeElement = weekHeader.locator("..").locator("p").first();
    await expect(weekRangeElement).toBeVisible({ timeout: 10000 });
    const initialWeekRange = await weekRangeElement.textContent();
    expect(initialWeekRange).toBeTruthy();

    // Click next week button (exact match to avoid Next.js Dev Tools button)
    await page.getByRole("button", { name: "Next", exact: true }).click();

    // Wait for the week range to change (use poll to handle timing issues)
    await expect
      .poll(async () => weekRangeElement.textContent(), { timeout: 10000 })
      .not.toBe(initialWeekRange);

    // Get the new week date display (unused but kept for clarity)
    const _nextWeekRange = await weekRangeElement.textContent();

    // Click previous week button to go back to original week
    await page.getByRole("button", { name: "Previous", exact: true }).click();

    // Wait for the week range to return to original
    await expect
      .poll(async () => weekRangeElement.textContent(), { timeout: 10000 })
      .toBe(initialWeekRange);

    // Click previous again to go to the previous week
    await page.getByRole("button", { name: "Previous", exact: true }).click();

    // Wait for the week range to change again
    await expect
      .poll(async () => weekRangeElement.textContent(), { timeout: 10000 })
      .not.toBe(initialWeekRange);

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

  test("should display weekend OFF zones", async ({ page }) => {
    // Create test account and login directly to weekly page
    const userData = await createTestAccount({
      page,
      callbackURL: "/app/weekly",
    });

    await page.waitForURL(/\/app\/weekly/, { timeout: 30000 });
    await page.waitForLoadState("networkidle");

    // Wait for the grid to be visible
    await expect(page.locator(".overflow-x-auto.rounded-lg")).toBeVisible({
      timeout: 10000,
    });

    // Verify OFF text appears for weekends (Saturday and Sunday)
    // EN: "OFF", FR: "REPOS"
    const offTexts = page.getByText(/^(OFF|REPOS)$/);
    await expect(offTexts).toHaveCount(2, { timeout: 10000 });

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

    await page.waitForURL(/\/app\/weekly/, { timeout: 30000 });
    await page.waitForLoadState("networkidle");

    // Now resize to mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Wait for layout to adjust
    await page.waitForTimeout(500);

    // Verify page displays on mobile (check h1 exists)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 10000,
    });

    // Verify header elements are visible (h2 for week info)
    await expect(
      page.getByRole("heading", { level: 2, name: /week of|semaine du/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Previous", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Next", exact: true }),
    ).toBeVisible();

    // Verify grid container exists
    const gridContainer = page.locator(".overflow-x-auto.rounded-lg").first();
    await expect(gridContainer).toBeVisible();

    // Verify time column is visible
    await expect(page.getByText("08:00")).toBeVisible();

    // Verify sidebar is hidden on mobile (lg:block means hidden on smaller screens)
    const sidebar = page.locator("aside.hidden.lg\\:block");
    await expect(sidebar).not.toBeVisible();

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

  test("should display work hours grid with proper time slots", async ({
    page,
  }) => {
    // Create test account and login directly to weekly page
    const userData = await createTestAccount({
      page,
      callbackURL: "/app/weekly",
    });

    await page.waitForURL(/\/app\/weekly/, { timeout: 30000 });
    await page.waitForLoadState("networkidle");

    // Wait for the grid to be visible
    await expect(page.locator(".overflow-x-auto.rounded-lg")).toBeVisible({
      timeout: 10000,
    });

    // Verify all time slots are displayed (08:00 to 19:00)
    const expectedTimes = [
      "08:00",
      "09:00",
      "10:00",
      "11:00",
      "12:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
      "17:00",
      "18:00",
      "19:00",
    ];

    await Promise.all(
      expectedTimes.map(async (time) =>
        expect(page.getByText(time)).toBeVisible(),
      ),
    );

    // Verify the grid has the correct structure
    const gridCells = page.locator(".h-16.border-b");
    const cellCount = await gridCells.count();

    // Should have 12 time slots * 7 days = 84 day cells + 12 time column cells = 96
    // Actually: 12 hours * 7 days = 84 day cells (time column cells are separate)
    expect(cellCount).toBeGreaterThanOrEqual(84);

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

  test("should display correct day headers with dates", async ({ page }) => {
    // Create test account and login directly to weekly page
    const userData = await createTestAccount({
      page,
      callbackURL: "/app/weekly",
    });

    await page.waitForURL(/\/app\/weekly/, { timeout: 30000 });
    await page.waitForLoadState("networkidle");

    // Wait for the grid to be visible
    await expect(page.locator(".overflow-x-auto.rounded-lg")).toBeVisible({
      timeout: 10000,
    });

    // Verify all day abbreviations are displayed (EN or FR)
    // EN: MON, TUE, WED, THU, FRI, SAT, SUN
    // FR: LUN, MAR, MER, JEU, VEN, SAM, DIM
    const dayHeaders = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

    await Promise.all(
      dayHeaders.map(async (day) => expect(page.getByText(day)).toBeVisible()),
    );

    // Verify day numbers are present (at least one number should be visible)
    // Day numbers vary depending on current date, so just check grid structure
    const headerCells = page.locator(".bg-muted\\/50.border-b-2.p-3");
    const headerCount = await headerCells.count();

    // Should have 8 header cells (1 empty corner + 7 days)
    expect(headerCount).toBe(8);

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
