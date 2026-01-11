import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";

test.describe("Internationalization (i18n)", () => {
  test("should switch language on dashboard page", async ({ page }) => {
    // Create test account and login
    const userData = await createTestAccount({
      page,
      callbackURL: "/app",
    });

    // Wait for dashboard page to load with regex pattern and longer timeout
    await page.waitForURL(/\/app$/, { timeout: 30000 });
    await page.waitForLoadState("networkidle");

    // Verify we're on the dashboard in English (default)
    // Wait for main heading with longer timeout for CI
    await expect(
      page.getByRole("heading", { name: /welcome back/i }),
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/weekly war room/i)).toBeVisible();
    await expect(page.getByText(/focus timer/i)).toBeVisible();
    await expect(
      page.getByRole("main").getByText(/task backlog/i),
    ).toBeVisible();
    await expect(page.getByText(/devflow ai/i)).toBeVisible();

    // Open user dropdown (in sidebar footer) - use email to find the button
    await page.getByText(userData.email).click();

    // Open Language submenu
    await page.getByRole("menuitem", { name: /language/i }).click();

    // Switch to French
    await page.getByRole("menuitem", { name: "Français" }).click();

    // Wait for page to reload with French translations
    await page.waitForTimeout(1000);

    // Verify French translations
    await expect(
      page.getByRole("heading", { name: /bon retour/i }),
    ).toBeVisible();
    await expect(page.getByText(/war room hebdomadaire/i)).toBeVisible();
    await expect(page.getByText(/minuteur de concentration/i)).toBeVisible();
    await expect(page.getByText(/backlog des tâches/i)).toBeVisible();
    await expect(page.getByText(/devflow ia/i)).toBeVisible();
    await expect(page.getByText(/bientôt disponible/i).first()).toBeVisible();

    // Switch back to English
    await page.getByText(userData.email).click();
    await page.getByRole("menuitem", { name: /language/i }).click();
    await page.getByRole("menuitem", { name: "English" }).click();

    // Wait for page to reload
    await page.waitForTimeout(1000);

    // Verify English translations are back
    await expect(
      page.getByRole("heading", { name: /welcome back/i }),
    ).toBeVisible();
    await expect(page.getByText(/coming soon/i).first()).toBeVisible();

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

  test("should switch language on backlog page", async ({ page }) => {
    // Create test account and login
    const userData = await createTestAccount({
      page,
      callbackURL: "/app/backlog",
    });

    // Wait for backlog page to load with regex pattern and longer timeout
    await page.waitForURL(/\/app\/backlog/, { timeout: 30000 });
    await page.waitForLoadState("networkidle");

    // Verify we're on the backlog in English (default)
    // Wait for the main heading to be visible with longer timeout for CI
    await expect(
      page.getByRole("heading", { name: /task backlog/i }),
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("heading", { name: /inbox/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /to do/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /doing/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /done/i })).toBeVisible();
    await expect(page.getByText(/all priorities/i)).toBeVisible();
    await expect(page.getByText(/all columns/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /new task/i })).toBeVisible();

    // Open user dropdown (in sidebar footer) - use email to find the button
    await page.getByText(userData.email).click();

    // Open Language submenu
    await page.getByRole("menuitem", { name: /language/i }).click();

    // Switch to French
    await page.getByRole("menuitem", { name: "Français" }).click();

    // Wait for page to reload with French translations
    await page.waitForTimeout(1000);

    // Verify French translations
    await expect(
      page.getByRole("heading", { name: /boîte de réception/i }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /à faire/i })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /en cours/i }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /terminé/i })).toBeVisible();
    await expect(page.getByText(/toutes les priorités/i)).toBeVisible();
    await expect(page.getByText(/toutes les colonnes/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /nouvelle tâche/i }),
    ).toBeVisible();

    // Switch back to English
    await page.getByText(userData.email).click();
    await page.getByRole("menuitem", { name: /language/i }).click();
    await page.getByRole("menuitem", { name: "English" }).click();

    // Wait for page to reload
    await page.waitForTimeout(1000);

    // Verify English translations are back
    await expect(page.getByRole("heading", { name: /inbox/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /new task/i })).toBeVisible();

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

  test("should persist language preference across page navigation", async ({
    page,
  }) => {
    // Create test account and login to dashboard
    const userData = await createTestAccount({
      page,
      callbackURL: "/app",
    });

    // Wait for navigation with regex pattern and longer timeout
    await page.waitForURL(/\/app$/, { timeout: 30000 });
    await page.waitForLoadState("networkidle");

    // Wait for page content to load
    await expect(
      page.getByRole("heading", { name: /welcome back/i }),
    ).toBeVisible({ timeout: 10000 });

    // Switch to French
    await page.getByText(userData.email).click();
    await page.getByRole("menuitem", { name: /language/i }).click();
    await page.getByRole("menuitem", { name: "Français" }).click();

    // Wait for reload
    await page.waitForTimeout(1000);

    // Verify French on dashboard
    await expect(
      page.getByRole("heading", { name: /bon retour/i }),
    ).toBeVisible();

    // Navigate to backlog
    await page.getByRole("link", { name: /task backlog/i }).click();
    await page.waitForURL("/app/backlog");

    // Wait for page to load
    await page.waitForTimeout(1000);

    // Verify language persisted (still French)
    await expect(
      page.getByRole("heading", { name: /boîte de réception/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /nouvelle tâche/i }),
    ).toBeVisible();

    // Navigate back to dashboard
    await page.getByRole("link", { name: /dashboard/i }).click();
    await page.waitForURL("/app");

    // Wait for page to load
    await page.waitForTimeout(1000);

    // Verify language still persisted (still French)
    await expect(
      page.getByRole("heading", { name: /bon retour/i }),
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

  test("should display French translations for task buttons", async ({
    page,
  }) => {
    // Create test account and login
    const userData = await createTestAccount({
      page,
      callbackURL: "/app/backlog",
    });

    await page.waitForURL("/app/backlog");

    // Get the user from database to create a task
    const user = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    expect(user).not.toBeNull();
    if (!user) throw new Error("User not found");

    // Create a test task
    await prisma.task.create({
      data: {
        userId: user.id,
        title: "Test i18n Task",
        description: "Testing language translations",
        priority: "important",
        difficulty: 3,
        estimatedDuration: 60,
        status: "inbox",
        kanbanColumn: "inbox",
        dependencies: [],
      },
    });

    // Reload page to see the task
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Verify task is visible in English
    await expect(page.getByText("Test i18n Task")).toBeVisible();

    // Verify English buttons exist
    const taskCard = page.getByRole("button").filter({
      hasText: "Test i18n Task",
    });
    await expect(taskCard.getByRole("button", { name: /edit/i })).toBeVisible();
    await expect(
      taskCard.getByRole("button", { name: /delete/i }),
    ).toBeVisible();

    // Switch to French
    await page.getByText(userData.email).click();
    await page.getByRole("menuitem", { name: /language/i }).click();
    await page.getByRole("menuitem", { name: "Français" }).click();

    // Wait for reload
    await page.waitForTimeout(1000);

    // Verify task buttons are now in French
    const taskCardFr = page.getByRole("button").filter({
      hasText: "Test i18n Task",
    });
    await expect(
      taskCardFr.getByRole("button", { name: /modifier/i }),
    ).toBeVisible();
    await expect(
      taskCardFr.getByRole("button", { name: /supprimer/i }),
    ).toBeVisible();

    // Clean up
    await prisma.task.deleteMany({
      where: { userId: user.id },
    });
    await prisma.user.delete({
      where: { id: user.id },
    });
  });
});
