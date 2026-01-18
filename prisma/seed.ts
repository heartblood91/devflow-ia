/* eslint-disable no-console */
/**
 * DevFlow Database Seed
 *
 * Seeds the database with test data for development:
 * - Admin user for testing /admin access (admin@devflow.app / admin@devflow.apP)
 * - Regular user for testing /app access (test@devflow.app / test@devflow.apP)
 * - Sample feedback entries
 * - Sample tasks in different statuses and priorities
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
      Origin: BASE_URL,
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
  await prisma.timeBlock.deleteMany();
  await prisma.task.deleteMany();
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

  // Create Sample Tasks for Test User
  console.log("📋 Creating sample tasks...");
  await prisma.task.createMany({
    data: [
      // Inbox tasks
      {
        id: nanoid(11),
        userId: testUser.id,
        title: "Implement SEPA payment with Stripe",
        description:
          "Integrate SEPA Direct Debit payment method using Stripe API. Need to handle mandate creation and payment intent.",
        priority: "sacred",
        difficulty: 5,
        estimatedDuration: 180,
        status: "inbox",
        kanbanColumn: "inbox",
        dependencies: [],
        deletedAt: null,
        archivedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: nanoid(11),
        userId: testUser.id,
        title: "Fix recurring donation bug",
        description:
          "Users report that recurring donations are not processing correctly after the last deployment.",
        priority: "important",
        difficulty: 3,
        estimatedDuration: 60,
        status: "inbox",
        kanbanColumn: "inbox",
        dependencies: [],
        deletedAt: null,
        archivedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: nanoid(11),
        userId: testUser.id,
        title: "Update documentation for API v2",
        description: null,
        priority: "optional",
        difficulty: 2,
        estimatedDuration: 45,
        status: "inbox",
        kanbanColumn: "inbox",
        dependencies: [],
        deletedAt: null,
        archivedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Todo tasks
      {
        id: nanoid(11),
        userId: testUser.id,
        title: "Refactor authentication middleware",
        description:
          "Current auth middleware is getting complex. Split into smaller, testable functions.",
        priority: "important",
        difficulty: 4,
        estimatedDuration: 120,
        status: "todo",
        kanbanColumn: "todo",
        quarter: "Q1 2026",
        dependencies: [],
        deletedAt: null,
        archivedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: nanoid(11),
        userId: testUser.id,
        title: "Add end-to-end tests for checkout flow",
        description:
          "Use Playwright to test the complete checkout process from cart to payment confirmation.",
        priority: "sacred",
        difficulty: 4,
        estimatedDuration: 150,
        status: "todo",
        kanbanColumn: "todo",
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        dependencies: [],
        deletedAt: null,
        archivedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Doing tasks
      {
        id: nanoid(11),
        userId: testUser.id,
        title: "Optimize database queries for dashboard",
        description:
          "Dashboard is loading slowly. Profile and optimize N+1 queries.",
        priority: "important",
        difficulty: 3,
        estimatedDuration: 90,
        status: "doing",
        kanbanColumn: "doing",
        dependencies: [],
        deletedAt: null,
        archivedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: nanoid(11),
        userId: testUser.id,
        title: "Design new landing page mockups",
        description: null,
        priority: "optional",
        difficulty: 2,
        estimatedDuration: 60,
        status: "doing",
        kanbanColumn: "doing",
        dependencies: [],
        deletedAt: null,
        archivedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Done tasks
      {
        id: nanoid(11),
        userId: testUser.id,
        title: "Setup CI/CD pipeline with GitHub Actions",
        description:
          "Automated testing and deployment on every PR merge to main.",
        priority: "important",
        difficulty: 4,
        estimatedDuration: 120,
        status: "done",
        kanbanColumn: "done",
        dependencies: [],
        deletedAt: null,
        archivedAt: null,
        completedAt: new Date(),
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        updatedAt: new Date(),
      },
      {
        id: nanoid(11),
        userId: testUser.id,
        title: "Add dark mode toggle",
        description: null,
        priority: "optional",
        difficulty: 2,
        estimatedDuration: 30,
        status: "done",
        kanbanColumn: "done",
        dependencies: [],
        deletedAt: null,
        archivedAt: null,
        completedAt: new Date(),
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        updatedAt: new Date(),
      },

      // More tasks for admin user to test filters
      {
        id: nanoid(11),
        userId: adminUser.id,
        title: "Review user feedback and prioritize features",
        description:
          "Go through all user feedback and create a prioritized backlog.",
        priority: "sacred",
        difficulty: 3,
        estimatedDuration: 90,
        status: "inbox",
        kanbanColumn: "inbox",
        dependencies: [],
        deletedAt: null,
        archivedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Archived tasks (completed and archived)
      {
        id: nanoid(11),
        userId: testUser.id,
        title: "Setup development environment",
        description:
          "Install Node.js, Docker, and configure VS Code with recommended extensions.",
        priority: "important",
        difficulty: 2,
        estimatedDuration: 60,
        status: "done",
        kanbanColumn: "done",
        dependencies: [],
        deletedAt: null,
        archivedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Archived 5 days ago
        completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // Completed 6 days ago
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
      {
        id: nanoid(11),
        userId: testUser.id,
        title: "Write project README",
        description: null,
        priority: "optional",
        difficulty: 1,
        estimatedDuration: 30,
        status: "done",
        kanbanColumn: "done",
        dependencies: [],
        deletedAt: null,
        archivedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // Archived 4 days ago
        completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Completed 5 days ago
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
      {
        id: nanoid(11),
        userId: testUser.id,
        title: "Configure ESLint and Prettier",
        description: "Setup linting rules and code formatting for the project.",
        priority: "important",
        difficulty: 2,
        estimatedDuration: 45,
        status: "done",
        kanbanColumn: "done",
        dependencies: [],
        deletedAt: null,
        archivedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Archived 3 days ago
        completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // Completed 4 days ago
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
    ],
  });
  console.log(
    "✅ Sample tasks created (14 tasks total - including 3 archived)",
  );

  // Get some task IDs for linking to time blocks
  const tasks = await prisma.task.findMany({
    where: { userId: testUser.id },
    take: 5,
  });

  // Create Sample TimeBlocks for Weekly View
  console.log("📅 Creating sample time blocks...");

  // Helper to get date for a specific day of current week (uses UTC noon to avoid timezone issues)
  const getWeekDay = (dayOffset: number) => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to Monday

    // Use UTC to avoid timezone issues with @db.Date
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + diff + dayOffset);

    // Create date at UTC noon to ensure correct day regardless of timezone
    return new Date(
      Date.UTC(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
        12,
        0,
        0,
      ),
    );
  };

  // Helper to create time with specific hour
  // Uses local time so times display correctly in the user's timezone
  const createTime = (date: Date, hour: number, minutes = 0) => {
    const time = new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      hour,
      minutes,
      0,
    );
    return time;
  };

  const monday = getWeekDay(0);
  const tuesday = getWeekDay(1);
  const wednesday = getWeekDay(2);
  const thursday = getWeekDay(3);
  const friday = getWeekDay(4);

  await prisma.timeBlock.createMany({
    data: [
      // Monday - Deep work morning
      {
        id: nanoid(11),
        userId: testUser.id,
        taskId: tasks[0]?.id ?? null,
        date: monday,
        startTime: createTime(monday, 9, 0),
        endTime: createTime(monday, 11, 0),
        blockType: "sacred",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: nanoid(11),
        userId: testUser.id,
        taskId: null,
        date: monday,
        startTime: createTime(monday, 11, 0),
        endTime: createTime(monday, 11, 30),
        blockType: "buffer",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: nanoid(11),
        userId: testUser.id,
        taskId: tasks[1]?.id ?? null,
        date: monday,
        startTime: createTime(monday, 14, 0),
        endTime: createTime(monday, 16, 0),
        blockType: "important",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Tuesday - Meetings & code review
      {
        id: nanoid(11),
        userId: testUser.id,
        taskId: null,
        date: tuesday,
        startTime: createTime(tuesday, 9, 30),
        endTime: createTime(tuesday, 10, 30),
        blockType: "important",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: nanoid(11),
        userId: testUser.id,
        taskId: tasks[2]?.id ?? null,
        date: tuesday,
        startTime: createTime(tuesday, 11, 0),
        endTime: createTime(tuesday, 12, 30),
        blockType: "optional",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: nanoid(11),
        userId: testUser.id,
        taskId: tasks[3]?.id ?? null,
        date: tuesday,
        startTime: createTime(tuesday, 14, 0),
        endTime: createTime(tuesday, 17, 0),
        blockType: "sacred",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Wednesday - Mixed day
      {
        id: nanoid(11),
        userId: testUser.id,
        taskId: null,
        date: wednesday,
        startTime: createTime(wednesday, 9, 0),
        endTime: createTime(wednesday, 10, 0),
        blockType: "rescue",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: nanoid(11),
        userId: testUser.id,
        taskId: tasks[4]?.id ?? null,
        date: wednesday,
        startTime: createTime(wednesday, 10, 30),
        endTime: createTime(wednesday, 12, 0),
        blockType: "important",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: nanoid(11),
        userId: testUser.id,
        taskId: null,
        date: wednesday,
        startTime: createTime(wednesday, 14, 0),
        endTime: createTime(wednesday, 15, 30),
        blockType: "optional",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Thursday - Focus day
      {
        id: nanoid(11),
        userId: testUser.id,
        taskId: tasks[0]?.id ?? null,
        date: thursday,
        startTime: createTime(thursday, 8, 0),
        endTime: createTime(thursday, 12, 0),
        blockType: "sacred",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: nanoid(11),
        userId: testUser.id,
        taskId: null,
        date: thursday,
        startTime: createTime(thursday, 13, 0),
        endTime: createTime(thursday, 13, 30),
        blockType: "buffer",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: nanoid(11),
        userId: testUser.id,
        taskId: tasks[1]?.id ?? null,
        date: thursday,
        startTime: createTime(thursday, 14, 0),
        endTime: createTime(thursday, 16, 30),
        blockType: "important",
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Friday - Wrap-up
      {
        id: nanoid(11),
        userId: testUser.id,
        taskId: null,
        date: friday,
        startTime: createTime(friday, 9, 0),
        endTime: createTime(friday, 10, 30),
        blockType: "rescue",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: nanoid(11),
        userId: testUser.id,
        taskId: tasks[2]?.id ?? null,
        date: friday,
        startTime: createTime(friday, 11, 0),
        endTime: createTime(friday, 12, 0),
        blockType: "optional",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: nanoid(11),
        userId: testUser.id,
        taskId: null,
        date: friday,
        startTime: createTime(friday, 14, 0),
        endTime: createTime(friday, 15, 0),
        blockType: "buffer",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  });
  console.log("✅ Sample time blocks created (15 blocks across Mon-Fri)");

  console.log("\n🎉 Seeding completed successfully!\n");
  console.log("📝 Test Accounts:");
  console.log("   👤 Test:  test@devflow.app  / test@devflow.apP");
  console.log("   🔑 Admin: admin@devflow.app / admin@devflow.apP");
  console.log("\n📋 Sample Tasks:");
  console.log("   📥 Inbox: 4 tasks (1 sacred, 1 important, 2 optional)");
  console.log("   📝 To Do: 2 tasks (1 sacred, 1 important)");
  console.log("   ⚡ Doing: 2 tasks (1 important, 1 optional)");
  console.log("   ✅ Done:  2 active tasks + 3 archived tasks");
  console.log("\n📅 Time Blocks:");
  console.log("   📌 Monday: 3 blocks (sacred, buffer, important)");
  console.log("   📌 Tuesday: 3 blocks (important, optional, sacred)");
  console.log("   📌 Wednesday: 3 blocks (rescue, important, optional)");
  console.log("   📌 Thursday: 3 blocks (sacred, buffer, important)");
  console.log("   📌 Friday: 3 blocks (rescue, optional, buffer)");
  console.log(
    "\n💡 You can now sign in and test the backlog + weekly view (including i18n FR/EN)!\n",
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
