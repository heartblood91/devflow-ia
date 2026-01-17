import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";
import { retry } from "./utils/retry";

test("sign up and verify account creation", async ({ page }) => {
  const userData = await createTestAccount({
    page,
    callbackURL: "/app",
  });

  // Wait for navigation with regex pattern and longer timeout
  await page.waitForURL(/\/app$/, { timeout: 30000 });
  await page.waitForLoadState("networkidle");

  // Verify we're on the app page
  expect(page.url()).toContain("/app");

  // Verify the user was created in the database with retry for race conditions
  // CI needs longer delays due to slower database operations
  const user = await retry(
    async () => {
      const foundUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });
      if (!foundUser) {
        throw new Error("User not found in database");
      }
      return foundUser;
    },
    {
      maxAttempts: 10,
      delayMs: 2000,
      backoff: true,
    },
  );

  // Verify user exists and has correct data
  expect(user).not.toBeNull();
  expect(user.name).toBe(userData.name);
  expect(user.email).toBe(userData.email);
  expect(user.emailVerified).toBe(false); // Email should not be verified yet

  // Clean up - delete the test user
  await prisma.user.delete({
    where: { id: user.id },
  });
});
