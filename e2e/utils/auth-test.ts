import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { faker } from "@faker-js/faker";
import type { Page } from "@playwright/test";
import { retry } from "./retry";

export const getUserEmail = () =>
  `playwright-test-${faker.internet.email().toLowerCase()}`;

/**
 * Helper function to create a test account
 * @returns Object containing the test user's credentials
 */
export async function createTestAccount(options: {
  page: Page;
  callbackURL?: string;
  initialUserData?: { name: string; email: string; password: string };
  admin?: boolean;
}) {
  // Generate fake user data
  const userData = options.initialUserData ?? {
    name: faker.person.fullName(),
    email: getUserEmail(),
    password: faker.internet.password({ length: 12, memorable: true }),
  };

  // Navigate to signup page
  await options.page.goto(`/auth/signup?callbackUrl=${options.callbackURL}`);

  // Fill out the form
  await options.page.getByLabel("Name").fill(userData.name);
  await options.page.getByLabel("Email").fill(userData.email);
  await options.page.getByTestId("signup-password").fill(userData.password);
  await options.page
    .getByTestId("signup-verify-password")
    .fill(userData.password);

  // Submit the form
  await options.page.getByTestId("signup-submit-button").click();

  // Wait for navigation to complete - we should be redirected to the callback URL
  if (options.callbackURL) {
    await options.page.waitForLoadState("networkidle");
    await options.page.waitForURL(new RegExp(options.callbackURL), {
      timeout: 30000,
    });
  }

  if (options.admin) {
    const user = await retry(
      async () =>
        prisma.user.findUniqueOrThrow({
          where: { email: userData.email },
        }),
      {
        maxAttempts: 5,
        delayMs: 1000,
        backoff: true,
      },
    );
    logger.info("Creating admin user", user);
    await prisma.user.update({
      where: { id: user.id },
      data: { role: "admin" },
    });
    // await 5 seconds
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  return userData;
}

/**
 * Helper function to sign in with an existing account
 * @returns Object containing the user's credentials
 */
export async function signInAccount(options: {
  page: Page;
  userData: { email: string; password: string };
  callbackURL?: string;
}) {
  const { page, userData, callbackURL } = options;

  // Navigate to signin page
  await page.goto(
    `/auth/signin${callbackURL ? `?callbackUrl=${callbackURL}` : ""}`,
  );

  // Fill out the form
  await page.getByLabel("Email").fill(userData.email);
  await page.getByTestId("signin-password").fill(userData.password);

  // Submit the form
  await page.getByTestId("signin-submit-button").click();

  // Wait for navigation to complete if a callback URL is provided
  if (callbackURL) {
    try {
      await page.waitForURL(new RegExp(callbackURL), { timeout: 30000 });
    } catch (error) {
      logger.error("Error waiting for navigation to complete", error);
    }
  }

  return userData;
}

/**
 * Helper function to sign out the current user
 * @param page - Playwright page object
 */
export async function signOutAccount(options: { page: Page }) {
  const { page } = options;

  // Navigate to account page if not already there
  if (!page.url().includes("/account")) {
    await page.goto(`/account`);
    await page.waitForLoadState("networkidle");
  }

  // Click the sign out button
  const signOutButton = page.getByRole("button", { name: /sign out/i });
  await signOutButton.waitFor({ state: "visible", timeout: 5000 });
  await signOutButton.click();

  // Wait for navigation to sign in page
  // Using a generous timeout since client-side navigation might take time
  await page.waitForURL(/\/auth\/signin/, {
    timeout: 15000,
    waitUntil: "domcontentloaded",
  });
}
