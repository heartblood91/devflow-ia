/* eslint-disable no-console */
/**
 * DevFlow Database Seed
 *
 * Seeds the database with test data for development:
 * - Admin user for testing /admin access (admin@devflow.app / admin@devflow.apP)
 * - Regular user for testing /app access (test@devflow.app / test@devflow.apP)
 * - Sample feedback entries
 */

import { PrismaClient } from "@/generated/prisma";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

async function createUserViaSignup(
  email: string,
  name: string,
  password: string,
  role: string,
) {
  // Use Better Auth's signup endpoint to create user with proper password hashing
  const response = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      name,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create user ${email}: ${error}`);
  }

  // Get the created user and update their role
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error(`User ${email} not found after signup`);
  }

  // Update user role and mark email as verified
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      role,
      emailVerified: true,
    },
  });

  return updatedUser;
}

async function main() {
  console.log("🌱 Seeding DevFlow database...");

  // Clean existing data (development only)
  console.log("🧹 Cleaning existing data...");
  await prisma.feedback.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // Create Test User (role: user)
  console.log("👤 Creating test user...");
  const testUser = await createUserViaSignup(
    "test@devflow.app",
    "Test DevFlow",
    "test@devflow.apP",
    "user",
  );
  console.log(`✅ Test user created: ${testUser.email} / test@devflow.apP`);

  // Create Admin User (role: admin)
  console.log("👤 Creating admin user...");
  const adminUser = await createUserViaSignup(
    "admin@devflow.app",
    "Admin DevFlow",
    "admin@devflow.apP",
    "admin",
  );
  console.log(`✅ Admin user created: ${adminUser.email} / admin@devflow.apP`);

  // Create Sample Feedbacks
  console.log("💬 Creating sample feedbacks...");
  await prisma.feedback.createMany({
    data: [
      {
        id: nanoid(11),
        review: 5,
        message: "DevFlow looks amazing! Can't wait to use it for my projects.",
        email: "happy@example.com",
        userId: testUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: nanoid(11),
        review: 4,
        message:
          "Great concept! Would love to see more integrations with existing tools.",
        email: "feedback@example.com",
        userId: null, // Anonymous feedback
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: nanoid(11),
        review: 5,
        message: "The time-blocking feature is exactly what I needed!",
        email: null,
        userId: adminUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  });
  console.log("✅ Sample feedbacks created");

  console.log("\n🎉 Seeding completed successfully!\n");
  console.log("📝 Test Accounts:");
  console.log("   👤 Test:  test@devflow.app  / test@devflow.apP");
  console.log("   🔑 Admin: admin@devflow.app / admin@devflow.apP");
  console.log("\n💡 You can now sign in with these credentials.\n");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
