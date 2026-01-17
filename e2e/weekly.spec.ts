import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

test.describe("Weekly Planning", () => {
  test("should display weekly page correctly", async ({ page }) => {
    // Create test account and login
    const userData = await createTestAccount({
      page,
      callbackURL: "/weekly",
    });

    // Wait for page to load
    await page.waitForURL("/weekly");
    await page.waitForLoadState("networkidle");

    // Verify we're on the weekly page
    expect(page.url()).toContain("/weekly");

    // Verify page title and description are visible
    await expect(
      page.getByRole("heading", { name: /weekly planning/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/plan your week with time-blocking/i),
    ).toBeVisible();

    // Verify week header is displayed
    await expect(page.getByText(/week of/i)).toBeVisible();

    // Verify navigation buttons are visible
    await expect(page.getByRole("button", { name: /previous/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /next/i })).toBeVisible();

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
    // Create test account and login
    const userData = await createTestAccount({
      page,
      callbackURL: "/weekly",
    });

    await page.waitForURL("/weekly");
    await page.waitForLoadState("networkidle");

    // Get the week date range element specifically (not the page description)
    // The week range is the second .text-lg.text-muted-foreground element in the header
    const weekRangeElement = page.locator("h2 + p.text-muted-foreground");
    const initialWeekRange = await weekRangeElement.textContent();
    expect(initialWeekRange).toBeTruthy();

    // Click next week button
    await page.getByRole("button", { name: /next/i }).click();

    // Wait for the week range to change
    await page.waitForTimeout(500);

    // Get the new week date display
    const nextWeekRange = await weekRangeElement.textContent();
    expect(nextWeekRange).not.toBe(initialWeekRange);

    // Click previous week button to go back to original week
    await page.getByRole("button", { name: /previous/i }).click();
    await page.waitForTimeout(500);

    // Verify we're back to the original week
    const backToOriginalRange = await weekRangeElement.textContent();
    expect(backToOriginalRange).toBe(initialWeekRange);

    // Click previous again to go to the previous week
    await page.getByRole("button", { name: /previous/i }).click();
    await page.waitForTimeout(500);

    const previousWeekRange = await weekRangeElement.textContent();
    expect(previousWeekRange).not.toBe(initialWeekRange);

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
    // Create test account and login
    const userData = await createTestAccount({
      page,
      callbackURL: "/weekly",
    });

    await page.waitForURL("/weekly");
    await page.waitForLoadState("networkidle");

    // Verify OFF text appears for weekends (Saturday and Sunday)
    const offTexts = page.getByText("OFF");
    await expect(offTexts).toHaveCount(2);

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
    // Create test account and login first (at default viewport)
    const userData = await createTestAccount({
      page,
      callbackURL: "/weekly",
    });

    await page.waitForURL("/weekly", { timeout: 30000 });
    await page.waitForLoadState("networkidle");

    // Now resize to mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Wait for layout to adjust
    await page.waitForTimeout(500);

    // Verify page displays on mobile
    await expect(
      page.getByRole("heading", { name: /weekly planning/i }),
    ).toBeVisible({ timeout: 10000 });

    // Verify header elements are visible
    await expect(page.getByText(/week of/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /previous/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /next/i })).toBeVisible();

    // Verify grid container exists
    const gridContainer = page.locator(".overflow-x-auto").first();
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
    // Create test account and login
    const userData = await createTestAccount({
      page,
      callbackURL: "/weekly",
    });

    await page.waitForURL("/weekly");
    await page.waitForLoadState("networkidle");

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
    // Create test account and login
    const userData = await createTestAccount({
      page,
      callbackURL: "/weekly",
    });

    await page.waitForURL("/weekly");
    await page.waitForLoadState("networkidle");

    // Verify all day abbreviations are displayed
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
