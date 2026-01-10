/* eslint-disable no-console */
/**
 * DevFlow Database Seed
 *
 * Seeds the database with test data for development:
 * - Admin user for testing /admin access
 * - Regular user for testing /app access
 * - Sample feedback entries
 */

import { PrismaClient } from "@/generated/prisma";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding DevFlow database...");

  // Clean existing data (development only)
  console.log("🧹 Cleaning existing data...");
  await prisma.feedback.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // Create Admin User
  console.log("👤 Creating admin user...");
  const adminUser = await prisma.user.create({
    data: {
      id: nanoid(),
      name: "Admin DevFlow",
      email: "admin@devflow.app",
      emailVerified: true,
      image: null,
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  console.log(`✅ Admin user created: ${adminUser.email}`);

  // Create Regular User
  console.log("👤 Creating regular user...");
  const regularUser = await prisma.user.create({
    data: {
      id: nanoid(),
      name: "Test User",
      email: "user@devflow.app",
      emailVerified: true,
      image: null,
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  console.log(`✅ Regular user created: ${regularUser.email}`);

  // Create Sample Feedbacks
  console.log("💬 Creating sample feedbacks...");
  await prisma.feedback.createMany({
    data: [
      {
        id: nanoid(11),
        review: 5,
        message: "DevFlow looks amazing! Can't wait to use it for my projects.",
        email: "happy@example.com",
        userId: regularUser.id,
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
  console.log(
    "   Admin: admin@devflow.app (no password set - use signup flow)",
  );
  console.log("   User:  user@devflow.app (no password set - use signup flow)");
  console.log("\n💡 Note: Better Auth handles password hashing during signup.");
  console.log(
    "   Use the signup flow to set passwords for these test users.\n",
  );
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
