import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";
import { retry } from "./utils/retry";

test.describe("Task Backlog", () => {
  test("should display backlog page and manage tasks", async ({ page }) => {
    // Create test account and login
    const userData = await createTestAccount({
      page,
      callbackURL: "/app/backlog",
    });

    // Wait for page to load
    await page.waitForURL(/\/app\/backlog/, { timeout: 30000 });

    // Verify we're on the backlog page
    expect(page.url()).toContain("/app/backlog");
    await expect(
      page.getByRole("heading", { name: /task backlog/i }),
    ).toBeVisible();

    // Verify the Kanban columns are displayed
    await expect(
      page.getByRole("heading", { name: /inbox.*0/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /to do.*0/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /doing.*0/i }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /done.*0/i })).toBeVisible();

    // Get the user from database to create tasks
    const user = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    expect(user).not.toBeNull();
    if (!user) throw new Error("User not found");

    // Create test tasks directly in the database
    await prisma.task.create({
      data: {
        userId: user.id,
        title: "Test Task 1",
        description: "This is a test task",
        priority: "important",
        difficulty: 3,
        estimatedDuration: 60,
        status: "inbox",
        kanbanColumn: "inbox",
        dependencies: [],
      },
    });

    await prisma.task.create({
      data: {
        userId: user.id,
        title: "Sacred Task",
        description: "High priority task",
        priority: "sacred",
        difficulty: 5,
        estimatedDuration: 120,
        status: "todo",
        kanbanColumn: "todo",
        dependencies: [],
      },
    });

    // Reload page to see new tasks
    await page.reload();

    // Verify tasks are displayed
    await expect(page.getByText("Test Task 1")).toBeVisible();
    await expect(page.getByText("Sacred Task")).toBeVisible();

    // Verify task counts updated
    await expect(
      page.getByRole("heading", { name: /inbox.*1/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /to do.*1/i }),
    ).toBeVisible();

    // Test priority filter
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: /🔴 sacred/i }).click();

    // Should only see Sacred Task
    await expect(page.getByText("Sacred Task")).toBeVisible();
    await expect(page.getByText("Test Task 1")).not.toBeVisible();

    // Reset filters
    await page.getByRole("button", { name: /reset filters/i }).click();

    // Both tasks should be visible again
    await expect(page.getByText("Test Task 1")).toBeVisible();
    await expect(page.getByText("Sacred Task")).toBeVisible();

    // Test column filter
    const columnFilter = page.getByRole("combobox").nth(1);
    await columnFilter.click();
    await page.getByRole("option", { name: /^inbox$/i }).click();

    // Should only see Test Task 1
    await expect(page.getByText("Test Task 1")).toBeVisible();
    await expect(page.getByText("Sacred Task")).not.toBeVisible();

    // Reset filters again
    await page.getByRole("button", { name: /reset filters/i }).click();

    // Wait for filters to reset
    await page.waitForLoadState("networkidle");

    // Test task deletion - delete Test Task 1 from Inbox
    // Find the task card that contains "Test Task 1" and click its delete button
    const testTask1Card = page
      .getByRole("button")
      .filter({ hasText: "Test Task 1" });
    const deleteButton = testTask1Card.getByRole("button", { name: /delete/i });
    await deleteButton.click();

    // Wait for the deletion to process
    await page.waitForTimeout(2000);

    // Verify task count decreased in Inbox
    await expect(page.getByTestId("kanban-column-heading-inbox")).toContainText(
      "0",
    );

    // Clean up - delete remaining tasks and user
    await prisma.task.deleteMany({
      where: { userId: user.id },
    });

    await prisma.user.delete({
      where: { id: user.id },
    });
  });

  test("should handle empty backlog state", async ({ page }) => {
    // Create test account
    const userData = await createTestAccount({
      page,
      callbackURL: "/app/backlog",
    });

    await page.waitForURL(/\/app\/backlog/, { timeout: 30000 });

    // Wait for page to be fully loaded
    await page.waitForLoadState("networkidle");

    // Verify empty states are displayed in all columns
    const emptyStates = page.getByText(/no tasks/i);
    await expect(emptyStates).toHaveCount(4); // One for each column

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

  test("should create a new task via UI", async ({ page }) => {
    // Create test account and login
    const userData = await createTestAccount({
      page,
      callbackURL: "/app/backlog",
    });

    await page.waitForURL(/\/app\/backlog/, { timeout: 30000 });

    // Wait for page to be fully loaded before clicking
    await page.waitForLoadState("networkidle");

    // Click "New Task" button
    await page.getByRole("button", { name: /new task/i }).click();

    // Wait for dialog to appear (with longer timeout)
    await expect(
      page.getByRole("heading", { name: /create new task/i }),
    ).toBeVisible({ timeout: 10000 });

    // Fill in the form
    await page.getByLabel(/^title$/i).fill("E2E Test Task");
    await page.getByLabel(/description/i).fill("Created via E2E test");
    await page.getByLabel(/difficulty/i).fill("4");
    await page.getByLabel(/estimated duration/i).fill("90");

    // Select priority
    await page.getByRole("combobox", { name: /priority/i }).click();
    await page.getByRole("option", { name: /🟠 important/i }).click();

    // Submit form
    await page.getByRole("button", { name: /create task/i }).click();

    // Wait for dialog to close
    await expect(
      page.getByRole("heading", { name: /create new task/i }),
    ).not.toBeVisible({ timeout: 5000 });

    // Verify task appears in Inbox
    await expect(page.getByText("E2E Test Task")).toBeVisible();
    await expect(page.getByText("Created via E2E test")).toBeVisible();

    // Verify inbox count increased
    await expect(
      page.getByRole("heading", { name: /inbox.*1/i }),
    ).toBeVisible();

    // Clean up
    const user = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (user) {
      await prisma.task.deleteMany({
        where: { userId: user.id },
      });
      await prisma.user.delete({
        where: { id: user.id },
      });
    }
  });

  test("should edit an existing task", async ({ page }) => {
    // Create test account and login
    const userData = await createTestAccount({
      page,
      callbackURL: "/app/backlog",
    });

    await page.waitForURL(/\/app\/backlog/, { timeout: 30000 });

    // Get the user from database with retry for race conditions
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
      { maxAttempts: 5, delayMs: 1000 },
    );

    // Create a test task
    await prisma.task.create({
      data: {
        userId: user.id,
        title: "Task to Edit",
        description: "Original description",
        priority: "optional",
        difficulty: 2,
        estimatedDuration: 30,
        status: "inbox",
        kanbanColumn: "inbox",
        dependencies: [],
      },
    });

    // Wait for page to be stable before reload
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Reload page
    await page.reload();

    // Wait for page to be fully loaded
    await page.waitForLoadState("networkidle");

    // Verify task is visible
    await expect(page.getByText("Task to Edit")).toBeVisible();

    // Click Edit button for the specific task
    const taskToEditCard = page
      .getByRole("button")
      .filter({ hasText: "Task to Edit" });
    const editButton = taskToEditCard.getByRole("button", { name: /edit/i });
    await editButton.click();

    // Wait for dialog
    await expect(
      page.getByRole("heading", { name: /edit task/i }),
    ).toBeVisible();

    // Verify form is pre-filled
    await expect(page.getByLabel(/^title$/i)).toHaveValue("Task to Edit");

    // Update the task
    await page.getByLabel(/^title$/i).fill("Updated Task Title");
    await page.getByLabel(/description/i).fill("Updated description");
    await page.getByLabel(/difficulty/i).fill("5");

    // Submit form
    await page.getByRole("button", { name: /update task/i }).click();

    // Wait for dialog to close
    await expect(
      page.getByRole("heading", { name: /edit task/i }),
    ).not.toBeVisible({ timeout: 10000 });

    // Wait for the update to propagate
    await page.waitForTimeout(1000);

    // Verify task was updated
    await expect(page.getByText("Updated Task Title")).toBeVisible();
    await expect(page.getByText("Updated description")).toBeVisible();
    await expect(page.getByText("5⭐")).toBeVisible();

    // Clean up
    await prisma.task.deleteMany({
      where: { userId: user.id },
    });
    await prisma.user.delete({
      where: { id: user.id },
    });
  });

  test("should drag and drop task between columns", async ({ page }) => {
    // Create test account and login
    const userData = await createTestAccount({
      page,
      callbackURL: "/app/backlog",
    });

    await page.waitForURL(/\/app\/backlog/, { timeout: 30000 });

    // Get the user from database with retry for race conditions
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
      { maxAttempts: 5, delayMs: 1000 },
    );

    // Create a test task in Inbox
    const createdTask = await prisma.task.create({
      data: {
        userId: user.id,
        title: "Task to Drag",
        description: "Will be moved",
        priority: "important",
        difficulty: 3,
        estimatedDuration: 60,
        status: "inbox",
        kanbanColumn: "inbox",
        dependencies: [],
      },
    });

    // Wait for page to be stable before reload
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Reload page
    await page.reload();

    // Wait for page to be fully loaded
    await page.waitForLoadState("networkidle");

    // Wait for task to be visible
    await expect(page.getByText("Task to Drag")).toBeVisible();

    // Verify task is in Inbox (count should be 1)
    await expect(page.getByTestId("kanban-column-heading-inbox")).toContainText(
      "1",
    );

    // Get the task card using testId
    const taskCard = page.getByTestId(`kanban-task-${createdTask.id}`);
    const taskBox = await taskCard.boundingBox();

    // Get the "To Do" droppable area using testId
    const todoDroppable = page.getByTestId("kanban-droppable-todo");
    const todoBox = await todoDroppable.boundingBox();

    expect(taskBox).not.toBeNull();
    expect(todoBox).not.toBeNull();
    if (!taskBox || !todoBox) throw new Error("Could not get bounding boxes");

    // Calculate positions for drag and drop
    const startX = taskBox.x + taskBox.width / 2;
    const startY = taskBox.y + taskBox.height / 2;
    const endX = todoBox.x + todoBox.width / 2;
    const endY = todoBox.y + 50;

    // Perform smooth drag with mouse movements
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.waitForTimeout(200);
    await page.mouse.move(endX, endY, { steps: 20 });
    await page.waitForTimeout(200);
    await page.mouse.up();

    // Wait for the move to complete and state to update
    await page.waitForTimeout(1500);

    // Verify task moved to To Do column
    await expect(page.getByTestId("kanban-column-heading-inbox")).toContainText(
      "0",
    );
    await expect(page.getByTestId("kanban-column-heading-todo")).toContainText(
      "1",
    );

    // Verify task is still visible
    await expect(page.getByText("Task to Drag")).toBeVisible();

    // Clean up
    await prisma.task.deleteMany({
      where: { userId: user.id },
    });
    await prisma.user.delete({
      where: { id: user.id },
    });
  });
});
