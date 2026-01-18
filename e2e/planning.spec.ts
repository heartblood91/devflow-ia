import { prisma } from "@/lib/prisma";
import { expect, test } from "@playwright/test";
import { createTestAccount } from "./utils/auth-test";
import { retry } from "./utils/retry";

test.describe("Weekly Planning Drag & Drop", () => {
  test("should display BacklogTasksList with plannable tasks", async ({
    page,
  }) => {
    // Create test account and navigate to weekly page
    const userData = await createTestAccount({
      page,
      callbackURL: "/app/weekly",
    });

    await page.waitForURL(/\/app\/weekly/, { timeout: 30000 });
    await page.waitForLoadState("networkidle");

    // Get user from database
    const user = await retry(
      async () => {
        const foundUser = await prisma.user.findUnique({
          where: { email: userData.email },
        });
        if (!foundUser) throw new Error("User not found");
        return foundUser;
      },
      { maxAttempts: 10, delayMs: 1500 },
    );

    // Create plannable tasks (sacred + important with status todo)
    await prisma.task.create({
      data: {
        userId: user.id,
        title: "Sacred Planning Task",
        description: "High priority task for planning",
        priority: "sacred",
        difficulty: 5,
        estimatedDuration: 120,
        status: "todo",
        kanbanColumn: "todo",
        dependencies: [],
      },
    });

    await prisma.task.create({
      data: {
        userId: user.id,
        title: "Important Planning Task",
        description: "Medium priority task for planning",
        priority: "important",
        difficulty: 3,
        estimatedDuration: 60,
        status: "todo",
        kanbanColumn: "todo",
        dependencies: [],
      },
    });

    // Open War Room modal
    const warRoomButton = page.getByRole("button", { name: /war room/i });
    await expect(warRoomButton).toBeVisible({ timeout: 10000 });
    await warRoomButton.click();

    // Wait for modal and backlog list
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("backlog-tasks-list")).toBeVisible({
      timeout: 10000,
    });

    // Verify tasks appear in backlog
    await expect(page.getByText("Sacred Planning Task")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("Important Planning Task")).toBeVisible({
      timeout: 10000,
    });

    // Verify badge shows correct count
    const backlogCard = page.getByTestId("backlog-tasks-list");
    await expect(backlogCard.getByText("2")).toBeVisible();

    // Clean up
    await prisma.task.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });

  test("should drag task from backlog to planning preview", async ({
    page,
  }) => {
    // Create test account
    const userData = await createTestAccount({
      page,
      callbackURL: "/app/weekly",
    });

    await page.waitForURL(/\/app\/weekly/, { timeout: 30000 });
    await page.waitForLoadState("networkidle");

    // Get user from database
    const user = await retry(
      async () => {
        const foundUser = await prisma.user.findUnique({
          where: { email: userData.email },
        });
        if (!foundUser) throw new Error("User not found");
        return foundUser;
      },
      { maxAttempts: 10, delayMs: 1500 },
    );

    // Create a task to drag
    const task = await prisma.task.create({
      data: {
        userId: user.id,
        title: "Draggable Task",
        description: "Task to drag to planning",
        priority: "sacred",
        difficulty: 4,
        estimatedDuration: 60,
        status: "todo",
        kanbanColumn: "todo",
        dependencies: [],
      },
    });

    // Reload to see new task
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Open War Room modal
    const warRoomButton = page.getByRole("button", { name: /war room/i });
    await expect(warRoomButton).toBeVisible({ timeout: 10000 });
    await warRoomButton.click();

    // Wait for backlog and planning preview
    await expect(page.getByTestId("backlog-tasks-list")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByTestId("planning-preview")).toBeVisible({
      timeout: 10000,
    });

    // Wait for task to appear
    await expect(page.getByText("Draggable Task")).toBeVisible({
      timeout: 10000,
    });

    // Get the task card and drop zone
    const taskCard = page.getByTestId(`task-card-${task.id}`);
    const dropZone = page.getByTestId("drop-zone-monday-10:00");

    await expect(taskCard).toBeVisible({ timeout: 5000 });
    await expect(dropZone).toBeVisible({ timeout: 5000 });

    // Get bounding boxes
    const taskBox = await taskCard.boundingBox();
    const dropBox = await dropZone.boundingBox();

    expect(taskBox).not.toBeNull();
    expect(dropBox).not.toBeNull();
    if (!taskBox || !dropBox) throw new Error("Could not get bounding boxes");

    // Perform drag and drop
    const startX = taskBox.x + taskBox.width / 2;
    const startY = taskBox.y + taskBox.height / 2;
    const endX = dropBox.x + dropBox.width / 2;
    const endY = dropBox.y + dropBox.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.waitForTimeout(200);
    await page.mouse.move(endX, endY, { steps: 20 });
    await page.waitForTimeout(200);
    await page.mouse.up();

    // Wait for state to update
    await page.waitForTimeout(1000);

    // Verify task appears in planning preview (in the drop zone)
    await expect(dropZone.getByText("Draggable Task")).toBeVisible({
      timeout: 5000,
    });

    // Verify task is no longer in backlog (excluded)
    const backlogList = page.getByTestId("backlog-tasks-list");
    await expect(backlogList.getByText("Draggable Task")).not.toBeVisible({
      timeout: 3000,
    });

    // Clean up
    await prisma.task.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });

  test("should drag task back to backlog (undo)", async ({ page }) => {
    // Create test account
    const userData = await createTestAccount({
      page,
      callbackURL: "/app/weekly",
    });

    await page.waitForURL(/\/app\/weekly/, { timeout: 30000 });
    await page.waitForLoadState("networkidle");

    // Get user
    const user = await retry(
      async () => {
        const foundUser = await prisma.user.findUnique({
          where: { email: userData.email },
        });
        if (!foundUser) throw new Error("User not found");
        return foundUser;
      },
      { maxAttempts: 10, delayMs: 1500 },
    );

    // Create task
    const task = await prisma.task.create({
      data: {
        userId: user.id,
        title: "Task for Undo Test",
        description: "Task to drag and undo",
        priority: "important",
        difficulty: 3,
        estimatedDuration: 45,
        status: "todo",
        kanbanColumn: "todo",
        dependencies: [],
      },
    });

    await page.reload();
    await page.waitForLoadState("networkidle");

    // Open modal
    const warRoomButton = page.getByRole("button", { name: /war room/i });
    await expect(warRoomButton).toBeVisible({ timeout: 10000 });
    await warRoomButton.click();

    await expect(page.getByTestId("backlog-tasks-list")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("Task for Undo Test")).toBeVisible({
      timeout: 10000,
    });

    // First drag: backlog -> planning preview
    const taskCard = page.getByTestId(`task-card-${task.id}`);
    const dropZone = page.getByTestId("drop-zone-tuesday-14:00");

    const taskBox1 = await taskCard.boundingBox();
    const dropBox = await dropZone.boundingBox();

    if (!taskBox1 || !dropBox)
      throw new Error("Could not get bounding boxes for first drag");

    await page.mouse.move(
      taskBox1.x + taskBox1.width / 2,
      taskBox1.y + taskBox1.height / 2,
    );
    await page.mouse.down();
    await page.waitForTimeout(200);
    await page.mouse.move(
      dropBox.x + dropBox.width / 2,
      dropBox.y + dropBox.height / 2,
      { steps: 20 },
    );
    await page.waitForTimeout(200);
    await page.mouse.up();
    await page.waitForTimeout(1000);

    // Verify task in drop zone
    await expect(dropZone.getByText("Task for Undo Test")).toBeVisible({
      timeout: 5000,
    });

    // Second drag: planning preview -> backlog (undo)
    // The task is now in the dropzone, we need to drag it back
    const taskInDropZone = dropZone.getByText("Task for Undo Test");
    const backlogList = page.getByTestId("backlog-tasks-list");

    const taskBox2 = await dropZone.boundingBox();
    const backlogBox = await backlogList.boundingBox();

    if (!taskBox2 || !backlogBox)
      throw new Error("Could not get bounding boxes for undo drag");

    await page.mouse.move(
      taskBox2.x + taskBox2.width / 2,
      taskBox2.y + taskBox2.height / 2,
    );
    await page.mouse.down();
    await page.waitForTimeout(200);
    await page.mouse.move(
      backlogBox.x + backlogBox.width / 2,
      backlogBox.y + 100,
      { steps: 20 },
    );
    await page.waitForTimeout(200);
    await page.mouse.up();
    await page.waitForTimeout(1000);

    // Verify task is back in backlog
    await expect(backlogList.getByText("Task for Undo Test")).toBeVisible({
      timeout: 5000,
    });

    // Verify task is no longer in drop zone
    await expect(taskInDropZone).not.toBeVisible({ timeout: 3000 });

    // Clean up
    await prisma.task.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });

  test("should populate preview when Generate Planning button is clicked", async ({
    page,
  }) => {
    // Create test account
    const userData = await createTestAccount({
      page,
      callbackURL: "/app/weekly",
    });

    await page.waitForURL(/\/app\/weekly/, { timeout: 30000 });
    await page.waitForLoadState("networkidle");

    // Get user
    const user = await retry(
      async () => {
        const foundUser = await prisma.user.findUnique({
          where: { email: userData.email },
        });
        if (!foundUser) throw new Error("User not found");
        return foundUser;
      },
      { maxAttempts: 10, delayMs: 1500 },
    );

    // Create tasks for generation
    await prisma.task.create({
      data: {
        userId: user.id,
        title: "Generate Test Task 1",
        description: "Task for generation",
        priority: "sacred",
        difficulty: 5,
        estimatedDuration: 90,
        status: "todo",
        kanbanColumn: "todo",
        dependencies: [],
      },
    });

    await prisma.task.create({
      data: {
        userId: user.id,
        title: "Generate Test Task 2",
        description: "Second task for generation",
        priority: "important",
        difficulty: 3,
        estimatedDuration: 60,
        status: "todo",
        kanbanColumn: "todo",
        dependencies: [],
      },
    });

    await page.reload();
    await page.waitForLoadState("networkidle");

    // Open modal
    const warRoomButton = page.getByRole("button", { name: /war room/i });
    await expect(warRoomButton).toBeVisible({ timeout: 10000 });
    await warRoomButton.click();

    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });

    // Click Generate Planning button
    const generateBtn = page.getByTestId("generate-planning-btn");
    await expect(generateBtn).toBeVisible({ timeout: 10000 });
    await expect(generateBtn).toBeEnabled();
    await generateBtn.click();

    // Wait for generation to complete (loading state ends)
    await page.waitForTimeout(2000);
    await expect(generateBtn).toBeEnabled({ timeout: 30000 });

    // Verify ChargeValidation appears after generation
    await expect(page.getByTestId("charge-validation")).toBeVisible({
      timeout: 10000,
    });

    // Verify tasks appear in planning preview (at least one task should be placed)
    const planningPreview = page.getByTestId("planning-preview");
    await expect(planningPreview.getByText(/Generate Test Task/)).toBeVisible({
      timeout: 10000,
    });

    // Clean up
    await prisma.task.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });

  test("should show ChargeValidation warning when workload exceeds 20h", async ({
    page,
  }) => {
    // Create test account
    const userData = await createTestAccount({
      page,
      callbackURL: "/app/weekly",
    });

    await page.waitForURL(/\/app\/weekly/, { timeout: 30000 });
    await page.waitForLoadState("networkidle");

    // Get user
    const user = await retry(
      async () => {
        const foundUser = await prisma.user.findUnique({
          where: { email: userData.email },
        });
        if (!foundUser) throw new Error("User not found");
        return foundUser;
      },
      { maxAttempts: 10, delayMs: 1500 },
    );

    // Create tasks that total more than 20 hours (1200+ minutes)
    // Create 25 tasks of 60 minutes each = 25 hours
    await prisma.task.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        userId: user.id,
        title: `Heavy Task ${i + 1}`,
        description: "Heavy workload task",
        priority: i % 2 === 0 ? "sacred" : "important",
        difficulty: 3,
        estimatedDuration: 60,
        status: "todo",
        kanbanColumn: "todo",
        dependencies: [],
      })),
    });

    await page.reload();
    await page.waitForLoadState("networkidle");

    // Open modal
    const warRoomButton = page.getByRole("button", { name: /war room/i });
    await expect(warRoomButton).toBeVisible({ timeout: 10000 });
    await warRoomButton.click();

    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });

    // Generate planning
    const generateBtn = page.getByTestId("generate-planning-btn");
    await generateBtn.click();

    // Wait for generation
    await page.waitForTimeout(3000);

    // Check ChargeValidation shows warning (red border indicates overloaded)
    const chargeValidation = page.getByTestId("charge-validation");
    await expect(chargeValidation).toBeVisible({ timeout: 10000 });

    // Check for red border class (overloaded state)
    await expect(chargeValidation).toHaveClass(/border-red-500/, {
      timeout: 5000,
    });

    // Verify Confirm button is disabled when overloaded
    const confirmBtn = page.getByTestId("confirm-planning-btn");
    await expect(confirmBtn).toBeDisabled();

    // Clean up
    await prisma.task.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });

  test("should save planning when Confirm button is clicked", async ({
    page,
  }) => {
    // Create test account
    const userData = await createTestAccount({
      page,
      callbackURL: "/app/weekly",
    });

    await page.waitForURL(/\/app\/weekly/, { timeout: 30000 });
    await page.waitForLoadState("networkidle");

    // Get user
    const user = await retry(
      async () => {
        const foundUser = await prisma.user.findUnique({
          where: { email: userData.email },
        });
        if (!foundUser) throw new Error("User not found");
        return foundUser;
      },
      { maxAttempts: 10, delayMs: 1500 },
    );

    // Create a small number of tasks (under 20h)
    await prisma.task.create({
      data: {
        userId: user.id,
        title: "Task to Save",
        description: "Task for confirm test",
        priority: "sacred",
        difficulty: 4,
        estimatedDuration: 60,
        status: "todo",
        kanbanColumn: "todo",
        dependencies: [],
      },
    });

    await page.reload();
    await page.waitForLoadState("networkidle");

    // Open modal
    const warRoomButton = page.getByRole("button", { name: /war room/i });
    await expect(warRoomButton).toBeVisible({ timeout: 10000 });
    await warRoomButton.click();

    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });

    // Generate planning first (required before confirm)
    const generateBtn = page.getByTestId("generate-planning-btn");
    await generateBtn.click();
    await page.waitForTimeout(2000);

    // Verify ChargeValidation shows green (not overloaded)
    const chargeValidation = page.getByTestId("charge-validation");
    await expect(chargeValidation).toBeVisible({ timeout: 10000 });
    await expect(chargeValidation).toHaveClass(/border-green-500/, {
      timeout: 5000,
    });

    // Click Confirm button
    const confirmBtn = page.getByTestId("confirm-planning-btn");
    await expect(confirmBtn).toBeEnabled({ timeout: 10000 });
    await confirmBtn.click();

    // Wait for save and modal to close
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10000 });

    // Verify time blocks were saved to database
    const timeBlocks = await prisma.timeBlock.findMany({
      where: { userId: user.id },
    });
    expect(timeBlocks.length).toBeGreaterThan(0);

    // Clean up
    await prisma.timeBlock.deleteMany({ where: { userId: user.id } });
    await prisma.task.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });
});
