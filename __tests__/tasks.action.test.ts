import {
  createTaskAction,
  deleteTaskAction,
  getTasksAction,
  updateTaskAction,
  updateTaskColumnAction,
  restoreTaskAction,
  archiveTaskAction,
} from "@/lib/actions/tasks.action";
import { prisma } from "@/lib/prisma";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock auth
vi.mock("@/lib/auth/auth-user", () => ({
  getRequiredUser: vi.fn(async () =>
    Promise.resolve({
      id: "test-user-id",
      email: "test@example.com",
      name: "Test User",
    }),
  ),
}));

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    task: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      createMany: vi.fn(),
    },
  },
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Task Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createTaskAction", () => {
    it("should create a task successfully", async () => {
      const mockTask = {
        id: "task-1",
        userId: "test-user-id",
        title: "Test Task",
        description: "Test Description",
        priority: "important" as const,
        difficulty: 3,
        estimatedDuration: 60,
        status: "inbox" as const,
        kanbanColumn: "inbox" as const,
        deadline: null,
        quarter: null,
        parentTaskId: null,
        dependencies: [],
        weekSkippedCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
        deletedAt: null,
        archivedAt: null,
      };

      vi.mocked(prisma.task.create).mockResolvedValue(mockTask);

      const result = await createTaskAction({
        title: "Test Task",
        description: "Test Description",
        priority: "important",
        difficulty: 3,
        estimatedDuration: 60,
      });

      expect(result.data).toEqual({
        success: true,
        taskId: "task-1",
      });

      expect(prisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "test-user-id",
          title: "Test Task",
          description: "Test Description",
          priority: "important",
          difficulty: 3,
          estimatedDuration: 60,
          status: "inbox",
          kanbanColumn: "inbox",
          dependencies: [],
        }),
      });
    });

    it("should create a task with subtasks", async () => {
      const mockTask = {
        id: "task-1",
        userId: "test-user-id",
        title: "Parent Task",
        description: null,
        priority: "important" as const,
        difficulty: 4,
        estimatedDuration: 120,
        status: "inbox" as const,
        kanbanColumn: "inbox" as const,
        deadline: null,
        quarter: null,
        parentTaskId: null,
        dependencies: [],
        weekSkippedCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
        deletedAt: null,
        archivedAt: null,
      };

      vi.mocked(prisma.task.create).mockResolvedValue(mockTask);
      vi.mocked(prisma.task.createMany).mockResolvedValue({ count: 2 });

      const result = await createTaskAction({
        title: "Parent Task",
        priority: "important",
        difficulty: 4,
        estimatedDuration: 120,
        subtasks: ["Subtask 1", "Subtask 2"],
      });

      expect(result.data?.success).toBe(true);
      expect(prisma.task.createMany).toHaveBeenCalled();
    });

    it("should fail with invalid input", async () => {
      const result = await createTaskAction({
        title: "",
        priority: "important",
        difficulty: 3,
        estimatedDuration: 60,
      });

      expect(result.validationErrors).toBeDefined();
      expect(prisma.task.create).not.toHaveBeenCalled();
    });
  });

  describe("updateTaskAction", () => {
    it("should update a task successfully", async () => {
      const mockTask = {
        id: "task-1",
        userId: "test-user-id",
        title: "Updated Task",
        description: "Updated Description",
        priority: "sacred" as const,
        difficulty: 5,
        estimatedDuration: 90,
        status: "doing" as const,
        kanbanColumn: "doing" as const,
        deadline: null,
        quarter: null,
        parentTaskId: null,
        dependencies: [],
        weekSkippedCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
        deletedAt: null,
        archivedAt: null,
      };

      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        ...mockTask,
        userId: "test-user-id",
      });
      vi.mocked(prisma.task.update).mockResolvedValue(mockTask);

      const result = await updateTaskAction({
        id: "task-1",
        title: "Updated Task",
        description: "Updated Description",
        priority: "sacred",
        difficulty: 5,
      });

      expect(result.data).toEqual({
        success: true,
        task: mockTask,
      });
    });

    it("should fail if task does not exist", async () => {
      vi.mocked(prisma.task.findUnique).mockResolvedValue(null);

      const result = await updateTaskAction({
        id: "non-existent",
        title: "Updated Task",
      });

      expect(result.serverError).toBe("Task not found");
    });

    it("should fail if user does not own the task", async () => {
      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        id: "task-1",
        userId: "other-user-id",
        title: "Task",
        description: null,
        priority: "optional" as const,
        difficulty: 3,
        estimatedDuration: 60,
        status: "inbox" as const,
        kanbanColumn: "inbox" as const,
        deadline: null,
        quarter: null,
        parentTaskId: null,
        dependencies: [],
        weekSkippedCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
        deletedAt: null,
        archivedAt: null,
      });

      const result = await updateTaskAction({
        id: "task-1",
        title: "Updated Task",
      });

      expect(result.serverError).toBe("Unauthorized");
    });
  });

  describe("deleteTaskAction", () => {
    it("should fail if task does not exist", async () => {
      vi.mocked(prisma.task.findUnique).mockResolvedValue(null);

      const result = await deleteTaskAction({ id: "non-existent" });

      expect(result.serverError).toBe("Task not found");
    });
  });

  describe("getTasksAction", () => {
    it("should get all tasks for user", async () => {
      const mockTasks = [
        {
          id: "task-1",
          userId: "test-user-id",
          title: "Task 1",
          description: null,
          priority: "important" as const,
          difficulty: 3,
          estimatedDuration: 60,
          status: "inbox" as const,
          kanbanColumn: "inbox" as const,
          deadline: null,
          quarter: null,
          parentTaskId: null,
          dependencies: [],
          weekSkippedCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          completedAt: null,
          deletedAt: null,
          archivedAt: null,
        },
      ];

      vi.mocked(prisma.task.findMany).mockResolvedValue(mockTasks);

      const result = await getTasksAction({});

      expect(result.data?.tasks).toEqual(mockTasks);
    });

    it("should filter tasks by priority", async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValue([]);

      await getTasksAction({ priority: "sacred" });

      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: {
          userId: "test-user-id",
          priority: "sacred",
          deletedAt: null, // Exclude soft-deleted tasks
        },
        include: { subtasks: true },
        orderBy: { createdAt: "desc" },
      });
    });
  });

  describe("updateTaskColumnAction", () => {
    it("should update task kanban column", async () => {
      const mockTask = {
        id: "task-1",
        userId: "test-user-id",
        title: "Task",
        description: null,
        priority: "optional" as const,
        difficulty: 3,
        estimatedDuration: 60,
        status: "doing" as const,
        kanbanColumn: "doing" as const,
        deadline: null,
        quarter: null,
        parentTaskId: null,
        dependencies: [],
        weekSkippedCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
        deletedAt: null,
        archivedAt: null,
      };

      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        ...mockTask,
        userId: "test-user-id",
      });
      vi.mocked(prisma.task.update).mockResolvedValue(mockTask);

      const result = await updateTaskColumnAction({
        id: "task-1",
        kanbanColumn: "doing",
      });

      expect(result.data?.success).toBe(true);
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: "task-1" },
        data: {
          kanbanColumn: "doing",
          status: "doing",
          completedAt: null,
        },
      });
    });

    it("should set completedAt when moving to done", async () => {
      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        id: "task-1",
        userId: "test-user-id",
        title: "Task",
        description: null,
        priority: "optional" as const,
        difficulty: 3,
        estimatedDuration: 60,
        status: "doing" as const,
        kanbanColumn: "doing" as const,
        deadline: null,
        quarter: null,
        parentTaskId: null,
        dependencies: [],
        weekSkippedCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
        deletedAt: null,
        archivedAt: null,
      });

      await updateTaskColumnAction({
        id: "task-1",
        kanbanColumn: "done",
      });

      expect(prisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            completedAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe("deleteTaskAction - soft delete", () => {
    it("should soft delete a task (set deletedAt)", async () => {
      const mockTask = {
        id: "task-1",
        userId: "test-user-id",
        title: "Task to delete",
        description: null,
        priority: "optional" as const,
        difficulty: 3,
        estimatedDuration: 60,
        status: "inbox" as const,
        kanbanColumn: "inbox" as const,
        deadline: null,
        quarter: null,
        parentTaskId: null,
        dependencies: [],
        weekSkippedCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
        deletedAt: null,
        archivedAt: null,
      };

      vi.mocked(prisma.task.findUnique).mockResolvedValue(mockTask);
      vi.mocked(prisma.task.update).mockResolvedValue({
        ...mockTask,
        deletedAt: new Date(),
      });

      const result = await deleteTaskAction({ id: "task-1" });

      expect(result.data).toEqual({ success: true });
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: "task-1" },
        data: { deletedAt: expect.any(Date) },
      });
      expect(prisma.task.delete).not.toHaveBeenCalled();
    });
  });

  describe("restoreTaskAction", () => {
    it("should restore a soft-deleted task", async () => {
      const mockTask = {
        id: "task-1",
        userId: "test-user-id",
        title: "Deleted Task",
        description: null,
        priority: "optional" as const,
        difficulty: 3,
        estimatedDuration: 60,
        status: "inbox" as const,
        kanbanColumn: "inbox" as const,
        deadline: null,
        quarter: null,
        parentTaskId: null,
        dependencies: [],
        weekSkippedCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
        deletedAt: new Date(),
        archivedAt: null,
      };

      vi.mocked(prisma.task.findUnique).mockResolvedValue(mockTask);
      vi.mocked(prisma.task.update).mockResolvedValue({
        ...mockTask,
        deletedAt: null,
      });

      const result = await restoreTaskAction({ id: "task-1" });

      expect(result.data).toEqual({ success: true });
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: "task-1" },
        data: {
          deletedAt: null,
          archivedAt: null, // Restore clears both flags
        },
      });
    });

    it("should restore an archived task to done column", async () => {
      const mockTask = {
        id: "task-1",
        userId: "test-user-id",
        title: "Archived Task",
        description: null,
        priority: "optional" as const,
        difficulty: 3,
        estimatedDuration: 60,
        status: "done" as const,
        kanbanColumn: "done" as const,
        deadline: null,
        quarter: null,
        parentTaskId: null,
        dependencies: [],
        weekSkippedCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
        deletedAt: null,
        archivedAt: new Date(),
      };

      vi.mocked(prisma.task.findUnique).mockResolvedValue(mockTask);
      vi.mocked(prisma.task.update).mockResolvedValue({
        ...mockTask,
        deletedAt: null,
        archivedAt: null,
      });

      const result = await restoreTaskAction({ id: "task-1" });

      expect(result.data).toEqual({ success: true });
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: "task-1" },
        data: {
          deletedAt: null,
          archivedAt: null, // Restore clears both flags
        },
      });
    });
  });

  describe("archiveTaskAction", () => {
    it("should archive a completed task", async () => {
      const mockTask = {
        id: "task-1",
        userId: "test-user-id",
        title: "Completed Task",
        description: null,
        priority: "optional" as const,
        difficulty: 3,
        estimatedDuration: 60,
        status: "done" as const,
        kanbanColumn: "done" as const,
        deadline: null,
        quarter: null,
        parentTaskId: null,
        dependencies: [],
        weekSkippedCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
        deletedAt: null,
        archivedAt: null,
      };

      vi.mocked(prisma.task.findUnique).mockResolvedValue(mockTask);
      vi.mocked(prisma.task.update).mockResolvedValue({
        ...mockTask,
        archivedAt: new Date(),
      });

      const result = await archiveTaskAction({ id: "task-1" });

      expect(result.data).toEqual({ success: true });
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: "task-1" },
        data: { archivedAt: expect.any(Date) },
      });
    });

    it("should fail if task is not completed", async () => {
      const mockTask = {
        id: "task-1",
        userId: "test-user-id",
        title: "In Progress Task",
        description: null,
        priority: "optional" as const,
        difficulty: 3,
        estimatedDuration: 60,
        status: "doing" as const,
        kanbanColumn: "doing" as const,
        deadline: null,
        quarter: null,
        parentTaskId: null,
        dependencies: [],
        weekSkippedCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
        deletedAt: null,
        archivedAt: null,
      };

      vi.mocked(prisma.task.findUnique).mockResolvedValue(mockTask);

      const result = await archiveTaskAction({ id: "task-1" });

      expect(result.serverError).toBe("Can only archive completed tasks");
    });
  });
});
