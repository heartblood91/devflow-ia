import {
  calculateWeeklyStats,
  type WeeklyStats,
} from "@/lib/stats/calculateWeeklyStats";
import { prisma } from "@/lib/prisma";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    task: {
      findMany: vi.fn(),
    },
    timeBlock: {
      findMany: vi.fn(),
    },
  },
}));

describe("calculateWeeklyStats", () => {
  const userId = "test-user-id";
  const weekStartDate = new Date("2026-01-12"); // Monday

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("return structure", () => {
    it("should return correct structure with all required fields", async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValue([]);
      vi.mocked(prisma.timeBlock.findMany).mockResolvedValue([]);

      const result = await calculateWeeklyStats(userId, weekStartDate);

      // Verify the structure matches WeeklyStats type
      const expectedKeys: (keyof WeeklyStats)[] = [
        "completedTasks",
        "totalTasks",
        "skippedTasks",
        "totalHours",
        "maxHours",
        "rescueUsed",
        "rescueMax",
        "avgFocusQuality",
        "avgEnergyLevel",
      ];

      expectedKeys.forEach((key) => {
        expect(result).toHaveProperty(key);
      });
    });

    it("should return numeric values for all fields", async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValue([]);
      vi.mocked(prisma.timeBlock.findMany).mockResolvedValue([]);

      const result = await calculateWeeklyStats(userId, weekStartDate);

      Object.values(result).forEach((value) => {
        expect(typeof value).toBe("number");
      });
    });

    it("should return default maxHours of 20", async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValue([]);
      vi.mocked(prisma.timeBlock.findMany).mockResolvedValue([]);

      const result = await calculateWeeklyStats(userId, weekStartDate);

      expect(result.maxHours).toBe(20);
    });

    it("should return default rescueMax of 2", async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValue([]);
      vi.mocked(prisma.timeBlock.findMany).mockResolvedValue([]);

      const result = await calculateWeeklyStats(userId, weekStartDate);

      expect(result.rescueMax).toBe(2);
    });
  });

  describe("task calculations", () => {
    it("should count completed tasks correctly", async () => {
      const mockTasks = [
        { id: "1", status: "done", timeBlocks: [] },
        { id: "2", status: "done", timeBlocks: [] },
        { id: "3", status: "inbox", timeBlocks: [] },
      ];
      vi.mocked(prisma.task.findMany).mockResolvedValue(mockTasks as never);
      vi.mocked(prisma.timeBlock.findMany).mockResolvedValue([]);

      const result = await calculateWeeklyStats(userId, weekStartDate);

      expect(result.completedTasks).toBe(2);
      expect(result.totalTasks).toBe(3);
      expect(result.skippedTasks).toBe(1);
    });

    it("should handle empty task list", async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValue([]);
      vi.mocked(prisma.timeBlock.findMany).mockResolvedValue([]);

      const result = await calculateWeeklyStats(userId, weekStartDate);

      expect(result.completedTasks).toBe(0);
      expect(result.totalTasks).toBe(0);
      expect(result.skippedTasks).toBe(0);
    });
  });

  describe("time block calculations", () => {
    it("should calculate total hours from working blocks", async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValue([]);

      // 2 hours of important work + 1 hour of sacred = 3 hours
      const mockTimeBlocks = [
        {
          id: "1",
          blockType: "important",
          startTime: new Date("2026-01-12T09:00:00"),
          endTime: new Date("2026-01-12T11:00:00"),
        },
        {
          id: "2",
          blockType: "sacred",
          startTime: new Date("2026-01-12T14:00:00"),
          endTime: new Date("2026-01-12T15:00:00"),
        },
      ];
      vi.mocked(prisma.timeBlock.findMany).mockResolvedValue(
        mockTimeBlocks as never,
      );

      const result = await calculateWeeklyStats(userId, weekStartDate);

      expect(result.totalHours).toBe(3);
    });

    it("should exclude buffer blocks from total hours", async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValue([]);

      const mockTimeBlocks = [
        {
          id: "1",
          blockType: "important",
          startTime: new Date("2026-01-12T09:00:00"),
          endTime: new Date("2026-01-12T11:00:00"),
        },
        {
          id: "2",
          blockType: "buffer",
          startTime: new Date("2026-01-12T12:00:00"),
          endTime: new Date("2026-01-12T13:00:00"),
        },
      ];
      vi.mocked(prisma.timeBlock.findMany).mockResolvedValue(
        mockTimeBlocks as never,
      );

      const result = await calculateWeeklyStats(userId, weekStartDate);

      expect(result.totalHours).toBe(2);
    });

    it("should exclude rescue blocks from total hours", async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValue([]);

      const mockTimeBlocks = [
        {
          id: "1",
          blockType: "important",
          startTime: new Date("2026-01-12T09:00:00"),
          endTime: new Date("2026-01-12T10:00:00"),
        },
        {
          id: "2",
          blockType: "rescue",
          startTime: new Date("2026-01-12T11:00:00"),
          endTime: new Date("2026-01-12T12:00:00"),
        },
      ];
      vi.mocked(prisma.timeBlock.findMany).mockResolvedValue(
        mockTimeBlocks as never,
      );

      const result = await calculateWeeklyStats(userId, weekStartDate);

      expect(result.totalHours).toBe(1);
    });

    it("should count rescue blocks used", async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValue([]);

      const mockTimeBlocks = [
        {
          id: "1",
          blockType: "rescue",
          startTime: new Date("2026-01-12T09:00:00"),
          endTime: new Date("2026-01-12T10:00:00"),
        },
        {
          id: "2",
          blockType: "rescue",
          startTime: new Date("2026-01-13T09:00:00"),
          endTime: new Date("2026-01-13T10:00:00"),
        },
        {
          id: "3",
          blockType: "important",
          startTime: new Date("2026-01-12T14:00:00"),
          endTime: new Date("2026-01-12T15:00:00"),
        },
      ];
      vi.mocked(prisma.timeBlock.findMany).mockResolvedValue(
        mockTimeBlocks as never,
      );

      const result = await calculateWeeklyStats(userId, weekStartDate);

      expect(result.rescueUsed).toBe(2);
    });
  });

  describe("focus and energy metrics", () => {
    it("should return 0 for avgFocusQuality (DailyReflection not implemented)", async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValue([]);
      vi.mocked(prisma.timeBlock.findMany).mockResolvedValue([]);

      const result = await calculateWeeklyStats(userId, weekStartDate);

      expect(result.avgFocusQuality).toBe(0);
    });

    it("should return 0 for avgEnergyLevel (DailyReflection not implemented)", async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValue([]);
      vi.mocked(prisma.timeBlock.findMany).mockResolvedValue([]);

      const result = await calculateWeeklyStats(userId, weekStartDate);

      expect(result.avgEnergyLevel).toBe(0);
    });
  });
});
