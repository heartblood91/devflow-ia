import { prisma } from "@/lib/prisma";
import { getServerUrl } from "@/lib/server-url";
import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import {
  createTestAccount,
  signInAccount,
  signOutAccount,
} from "./utils/auth-test";

test.describe("account", () => {
  test("delete account flow", async ({ page }) => {
    const userData = await createTestAccount({
      page,
      callbackURL: "/account",
    });

    await page.getByRole("link", { name: "Danger" }).click();
    await page.waitForURL(/\/account\/danger/, { timeout: 10000 });
    await page.getByRole("button", { name: "Delete" }).click();

    const deleteDialog = page.getByRole("alertdialog", {
      name: "Delete your account ?",
    });
    await expect(deleteDialog).toBeVisible();

    const confirmInput = deleteDialog.getByRole("textbox");
    await confirmInput.fill("Delete");

    const deleteButton = deleteDialog.getByRole("button", { name: /delete/i });
    await expect(deleteButton).toBeEnabled();
    await deleteButton.click();

    await expect(page.getByText("Your deletion has been asked.")).toBeVisible();

    const verification = await prisma.verification.findFirst({
      where: {
        identifier: {
          contains: "delete-account",
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const token = verification?.identifier.replace("delete-account-", "");
    expect(token).not.toBeNull();

    const resetToken = token;
    const confirmUrl = `${getServerUrl()}/auth/confirm-delete?token=${resetToken}&callbackUrl=/auth/goodbye`;
    await page.goto(confirmUrl);

    await page.getByRole("button", { name: "Yes, Delete My Account" }).click();
    await page.waitForURL(/\/auth\/goodbye/, { timeout: 10000 });
    await expect(page.getByTestId("goodbye-page-heading")).toBeVisible();

    const user = await prisma.user.findUnique({
      where: {
        email: userData.email,
      },
    });

    expect(user).toBeNull();
  });

  test("update name flow", async ({ page }) => {
    const userData = await createTestAccount({ page, callbackURL: "/account" });

    await page.getByRole("heading", { name: "Settings", level: 2 }).waitFor({
      timeout: 10000,
    });

    const newName = faker.person.fullName();
    const input = page.getByRole("textbox", { name: "Name" });
    await input.clear();
    await input.fill(newName);

    // Click save button
    const saveButton = page.getByRole("button", { name: /save/i });
    await saveButton.click();

    // Wait for mutation to complete - button becomes enabled again
    await expect(saveButton).toBeEnabled({ timeout: 10000 });

    // Wait for network to be idle after the save
    await page.waitForLoadState("networkidle");

    // Verify in database that update was successful
    const user = await prisma.user.findUnique({
      where: { email: userData.email },
    });
    expect(user?.name).toBe(newName);

    // Reload and verify persistence in UI
    await page.reload();
    await page.waitForLoadState("networkidle");

    const updatedInput = page.getByRole("textbox", { name: "Name" });
    await expect(updatedInput).toHaveValue(newName, { timeout: 10000 });

    // Clean up - delete user
    if (user) {
      await prisma.user.delete({
        where: { id: user.id },
      });
    }
  });

  test("change password flow", async ({ page }) => {
    const userData = await createTestAccount({ page, callbackURL: "/account" });

    await page.getByRole("link", { name: /change password/i }).click();

    const newPassword = faker.internet.password({
      length: 12,
      memorable: true,
    });
    await page.getByTestId("change-password-current").fill(userData.password);
    await page.getByTestId("change-password-new").fill(newPassword);
    await page.getByTestId("change-password-confirm").fill(newPassword);

    const submitButton = page.getByRole("button", { name: /Change Password/i });
    await submitButton.click();

    // Wait for success: form redirects to /account after password change
    await page.waitForURL(/\/account\/?$/, { timeout: 15000 });
    await page.waitForLoadState("networkidle");

    await signOutAccount({ page });

    await signInAccount({
      page,
      userData: {
        email: userData.email,
        password: newPassword,
      },
      callbackURL: "/app",
    });

    await page.waitForURL(/\/app/, { timeout: 10000 });

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
