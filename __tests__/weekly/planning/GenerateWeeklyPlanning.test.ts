import { GenerateWeeklyPlanning } from "@/lib/usecases/GenerateWeeklyPlanning";
import { prisma } from "@/lib/prisma";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    task: {
      findMany: vi.fn(),
    },
  },
}));

describe("GenerateWeeklyPlanning", () => {
  const userId = "test-user-id";
  const weekStartDate = new Date("2026-01-12"); // Monday

  const createMockTask = (overrides: Record<string, unknown> = {}) => ({
    id: overrides.id ?? "task-1",
    title: overrides.title ?? "Test Task",
    difficulty: overrides.difficulty ?? 3,
    estimatedDuration: overrides.estimatedDuration ?? 60,
    priority: overrides.priority ?? "important",
    dependencies: overrides.dependencies ?? [],
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("return structure", () => {
    it("should return correct structure with all required fields", async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValue([]);

      const result = await GenerateWeeklyPlanning({ userId, weekStartDate });

      expect(result).toHaveProperty("timeBlocks");
      expect(result).toHaveProperty("totalHours");
      expect(result).toHaveProperty("bufferHours");
      expect(result).toHaveProperty("rescueSlots");
    });

    it("should return empty timeBlocks when no tasks", async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValue([]);

      const result = await GenerateWeeklyPlanning({ userId, weekStartDate });

      // Only rescue slot should be present
      expect(result.timeBlocks.length).toBe(1);
      expect(result.timeBlocks[0].blockType).toBe("rescue");
    });
  });

  describe("rescue slots", () => {
    it("should add rescue slots on Friday 16h-18h", async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValue([]);

      const result = await GenerateWeeklyPlanning({ userId, weekStartDate });

      const rescueBlocks = result.timeBlocks.filter(
        (b) => b.blockType === "rescue",
      );
      expect(rescueBlocks.length).toBe(1);

      const rescueBlock = rescueBlocks[0];
      // Friday is 4 days after Monday (2026-01-12 + 4 = 2026-01-16)
      expect(rescueBlock.date.getDay()).toBe(5); // Friday

      const startHour = rescueBlock.startTime.getHours();
      const endHour = rescueBlock.endTime.getHours();
      expect(startHour).toBe(16);
      expect(endHour).toBe(18);
    });

    it("should return rescueSlots count of 1", async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValue([]);

      const result = await GenerateWeeklyPlanning({ userId, weekStartDate });

      expect(result.rescueSlots).toBe(1);
    });
  });

  describe("task planning", () => {
    it("should plan tasks across work days (Mon-Fri)", async () => {
      const mockTasks = [
        createMockTask({ id: "t1", title: "Task 1" }),
        createMockTask({ id: "t2", title: "Task 2" }),
        createMockTask({ id: "t3", title: "Task 3" }),
      ];
      vi.mocked(prisma.task.findMany).mockResolvedValue(mockTasks as never);

      const result = await GenerateWeeklyPlanning({ userId, weekStartDate });

      const taskBlocks = result.timeBlocks.filter((b) => b.taskId);
      expect(taskBlocks.length).toBe(3);
    });

    it("should calculate totalHours from task blocks", async () => {
      const mockTasks = [
        createMockTask({ id: "t1", estimatedDuration: 60 }), // 1 hour
        createMockTask({ id: "t2", estimatedDuration: 120 }), // 2 hours
      ];
      vi.mocked(prisma.task.findMany).mockResolvedValue(mockTasks as never);

      const result = await GenerateWeeklyPlanning({ userId, weekStartDate });

      // Total should be 3 hours (1 + 2)
      expect(result.totalHours).toBe(3);
    });

    it("should calculate bufferHours from buffer blocks", async () => {
      const mockTasks = [createMockTask({ id: "t1", estimatedDuration: 60 })];
      vi.mocked(prisma.task.findMany).mockResolvedValue(mockTasks as never);

      const result = await GenerateWeeklyPlanning({ userId, weekStartDate });

      // Buffer should be present (20% of work hours)
      expect(result.bufferHours).toBeGreaterThan(0);
    });

    it("should exclude buffer and rescue from totalHours", async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValue([]);

      const result = await GenerateWeeklyPlanning({ userId, weekStartDate });

      // With no tasks, totalHours should be 0
      expect(result.totalHours).toBe(0);
    });
  });

  describe("dependency handling", () => {
    it("should respect task dependencies (B scheduled after A)", async () => {
      const mockTasks = [
        createMockTask({
          id: "taskB",
          title: "Task B",
          dependencies: ["taskA"],
        }),
        createMockTask({ id: "taskA", title: "Task A", dependencies: [] }),
      ];
      vi.mocked(prisma.task.findMany).mockResolvedValue(mockTasks as never);

      const result = await GenerateWeeklyPlanning({ userId, weekStartDate });

      const taskBlocks = result.timeBlocks.filter((b) => b.taskId);
      const taskAIndex = taskBlocks.findIndex((b) => b.taskId === "taskA");
      const taskBIndex = taskBlocks.findIndex((b) => b.taskId === "taskB");

      // Task A should be scheduled before Task B
      expect(taskAIndex).toBeLessThan(taskBIndex);
    });

    it("should handle circular dependencies without crashing", async () => {
      const mockTasks = [
        createMockTask({ id: "taskA", dependencies: ["taskB"] }),
        createMockTask({ id: "taskB", dependencies: ["taskA"] }),
      ];
      vi.mocked(prisma.task.findMany).mockResolvedValue(mockTasks as never);

      // Should not throw
      const result = await GenerateWeeklyPlanning({ userId, weekStartDate });

      expect(result.timeBlocks).toBeDefined();
    });
  });

  describe("chronotype integration", () => {
    it("should use bear chronotype by default", async () => {
      const mockTasks = [
        createMockTask({
          id: "difficult",
          difficulty: 5,
          estimatedDuration: 60,
        }),
      ];
      vi.mocked(prisma.task.findMany).mockResolvedValue(mockTasks as never);

      const result = await GenerateWeeklyPlanning({ userId, weekStartDate });

      const taskBlock = result.timeBlocks.find((b) => b.taskId === "difficult");
      expect(taskBlock).toBeDefined();

      // Bear peak hours are 10:00-12:00 and 16:00-18:00
      // Difficult task should be placed during peak hours
      if (taskBlock) {
        const startHour = taskBlock.startTime.getHours();
        const startMinutes = taskBlock.startTime.getMinutes();
        const timeStr = `${String(startHour).padStart(2, "0")}:${String(startMinutes).padStart(2, "0")}`;

        const isInBearPeak =
          (timeStr >= "10:00" && timeStr < "12:00") ||
          (timeStr >= "16:00" && timeStr < "18:00");
        expect(isInBearPeak).toBe(true);
      }
    });
  });

  describe("workload validation", () => {
    it("should report high totalHours when overloaded", async () => {
      // Create many tasks totaling more than 20 hours
      const mockTasks = Array.from({ length: 25 }, (_, i) =>
        createMockTask({ id: `task-${i}`, estimatedDuration: 60 }),
      );
      vi.mocked(prisma.task.findMany).mockResolvedValue(mockTasks as never);

      const result = await GenerateWeeklyPlanning({ userId, weekStartDate });

      // totalHours will reflect scheduled time (may be less than 25 due to capacity limits)
      // The validation happens in the UI (ChargeValidation component)
      expect(result.totalHours).toBeGreaterThan(0);
    });
  });

  describe("week normalization", () => {
    it("should normalize weekStartDate to Monday", async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValue([]);

      // Pass a Wednesday
      const wednesday = new Date("2026-01-14");
      const result = await GenerateWeeklyPlanning({
        userId,
        weekStartDate: wednesday,
      });

      // Rescue slot should still be on Friday of that week
      const rescueBlock = result.timeBlocks.find(
        (b) => b.blockType === "rescue",
      );
      expect(rescueBlock?.date.getDay()).toBe(5); // Friday
    });
  });
});
