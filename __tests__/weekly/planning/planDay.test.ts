import {
  planDay,
  type PlanDayOptions,
  type TaskForPlanning,
} from "@/lib/stats/planDay";
import { describe, expect, it } from "vitest";

describe("planDay", () => {
  const monday = new Date("2026-01-12");
  const defaultWorkHours = { start: "08:00", end: "18:00" }; // 10 hours
  const bearPeakHours = [
    { start: "10:00", end: "12:00" },
    { start: "16:00", end: "18:00" },
  ];

  const createTask = (
    overrides: Partial<TaskForPlanning> = {},
  ): TaskForPlanning => ({
    id: overrides.id ?? "task-1",
    title: overrides.title ?? "Test Task",
    difficulty: overrides.difficulty ?? 3,
    estimatedDuration: overrides.estimatedDuration ?? 60,
    priority: overrides.priority ?? "important",
  });

  describe("empty tasks", () => {
    it("should return empty array when no tasks", () => {
      const options: PlanDayOptions = {
        day: monday,
        workHours: defaultWorkHours,
        peakHours: bearPeakHours,
        tasks: [],
      };

      const result = planDay(options);

      expect(result).toEqual([]);
    });
  });

  describe("buffer time calculation", () => {
    it("should add 20% buffer time by default", () => {
      const options: PlanDayOptions = {
        day: monday,
        workHours: defaultWorkHours,
        peakHours: bearPeakHours,
        tasks: [createTask({ estimatedDuration: 480 })], // 8 hours task
      };

      const result = planDay(options);

      // Total work time: 10 hours (600 min)
      // Buffer: 20% = 120 min (2 hours)
      // Available for tasks: 480 min (8 hours)
      const bufferBlocks = result.filter((b) => b.blockType === "buffer");
      expect(bufferBlocks.length).toBeGreaterThan(0);
    });

    it("should respect custom buffer percentage", () => {
      const options: PlanDayOptions = {
        day: monday,
        workHours: defaultWorkHours,
        peakHours: bearPeakHours,
        tasks: [createTask({ estimatedDuration: 60 })],
        bufferPercentage: 30,
      };

      const result = planDay(options);

      // Verify buffer block exists
      const bufferBlocks = result.filter((b) => b.blockType === "buffer");
      expect(bufferBlocks.length).toBe(1);
    });

    it("should add buffer block at end of day", () => {
      const options: PlanDayOptions = {
        day: monday,
        workHours: defaultWorkHours,
        peakHours: bearPeakHours,
        tasks: [createTask({ estimatedDuration: 60 })],
      };

      const result = planDay(options);

      const lastBlock = result[result.length - 1];
      expect(lastBlock.blockType).toBe("buffer");
    });
  });

  describe("difficulty-based scheduling", () => {
    it("should place difficult tasks (4-5 stars) on peak hours", () => {
      const difficultTask = createTask({
        id: "difficult",
        title: "Difficult Task",
        difficulty: 5,
        estimatedDuration: 60,
      });

      const options: PlanDayOptions = {
        day: monday,
        workHours: defaultWorkHours,
        peakHours: bearPeakHours,
        tasks: [difficultTask],
      };

      const result = planDay(options);

      const taskBlock = result.find((b) => b.taskId === "difficult");
      expect(taskBlock).toBeDefined();

      // Task should start during peak hours (10:00-12:00 or 16:00-18:00)
      if (taskBlock) {
        const startHour = taskBlock.startTime.getHours();
        const startMinutes = taskBlock.startTime.getMinutes();
        const startTimeStr = `${String(startHour).padStart(2, "0")}:${String(startMinutes).padStart(2, "0")}`;

        // Check if within peak hours
        const isInPeak = bearPeakHours.some(
          (peak) => startTimeStr >= peak.start && startTimeStr < peak.end,
        );
        expect(isInPeak).toBe(true);
      }
    });

    it("should sort tasks by difficulty (difficult first)", () => {
      const tasks = [
        createTask({ id: "easy", difficulty: 1 }),
        createTask({ id: "hard", difficulty: 5 }),
        createTask({ id: "medium", difficulty: 3 }),
      ];

      const options: PlanDayOptions = {
        day: monday,
        workHours: defaultWorkHours,
        peakHours: bearPeakHours,
        tasks,
      };

      const result = planDay(options);
      const taskBlocks = result.filter((b) => b.taskId);

      // First task scheduled should be the hard one
      expect(taskBlocks[0].taskId).toBe("hard");
    });

    it("should place medium tasks (3 stars) on normal hours", () => {
      const mediumTask = createTask({
        id: "medium",
        difficulty: 3,
        estimatedDuration: 60,
      });

      const options: PlanDayOptions = {
        day: monday,
        workHours: { start: "08:00", end: "09:00" }, // No peak hours in this window
        peakHours: bearPeakHours,
        tasks: [mediumTask],
      };

      const result = planDay(options);

      const taskBlock = result.find((b) => b.taskId === "medium");
      expect(taskBlock).toBeDefined();
    });

    it("should place easy tasks (1-2 stars) on remaining hours", () => {
      const easyTask = createTask({
        id: "easy",
        difficulty: 1,
        estimatedDuration: 60,
      });

      const options: PlanDayOptions = {
        day: monday,
        workHours: defaultWorkHours,
        peakHours: bearPeakHours,
        tasks: [easyTask],
      };

      const result = planDay(options);

      const taskBlock = result.find((b) => b.taskId === "easy");
      expect(taskBlock).toBeDefined();
    });
  });

  describe("time block structure", () => {
    it("should create blocks with correct structure", () => {
      const task = createTask({ priority: "sacred" });
      const options: PlanDayOptions = {
        day: monday,
        workHours: defaultWorkHours,
        peakHours: bearPeakHours,
        tasks: [task],
      };

      const result = planDay(options);
      const taskBlock = result.find((b) => b.taskId);

      expect(taskBlock).toMatchObject({
        date: monday,
        blockType: "sacred",
        taskId: "task-1",
        taskTitle: "Test Task",
      });
      expect(taskBlock?.startTime).toBeInstanceOf(Date);
      expect(taskBlock?.endTime).toBeInstanceOf(Date);
    });

    it("should set correct duration based on estimatedDuration", () => {
      const task = createTask({ estimatedDuration: 90 }); // 90 minutes
      const options: PlanDayOptions = {
        day: monday,
        workHours: defaultWorkHours,
        peakHours: bearPeakHours,
        tasks: [task],
      };

      const result = planDay(options);
      const taskBlock = result.find((b) => b.taskId);

      if (taskBlock) {
        const duration =
          (taskBlock.endTime.getTime() - taskBlock.startTime.getTime()) /
          (1000 * 60);
        expect(duration).toBe(90);
      }
    });

    it("should use task priority as blockType", () => {
      const sacredTask = createTask({ id: "sacred", priority: "sacred" });
      const importantTask = createTask({
        id: "important",
        priority: "important",
      });

      const options: PlanDayOptions = {
        day: monday,
        workHours: defaultWorkHours,
        peakHours: bearPeakHours,
        tasks: [sacredTask, importantTask],
      };

      const result = planDay(options);

      const sacred = result.find((b) => b.taskId === "sacred");
      const important = result.find((b) => b.taskId === "important");

      expect(sacred?.blockType).toBe("sacred");
      expect(important?.blockType).toBe("important");
    });
  });

  describe("input validation", () => {
    it("should throw error for invalid time format", () => {
      const options: PlanDayOptions = {
        day: monday,
        workHours: { start: "invalid", end: "18:00" },
        peakHours: bearPeakHours,
        tasks: [createTask()],
      };

      expect(() => planDay(options)).toThrow(/Invalid time format/);
    });

    it("should throw error when end time is before start time", () => {
      const options: PlanDayOptions = {
        day: monday,
        workHours: { start: "18:00", end: "08:00" },
        peakHours: bearPeakHours,
        tasks: [createTask()],
      };

      expect(() => planDay(options)).toThrow(/end time.*must be after/);
    });

    it("should throw error for invalid hour values", () => {
      const options: PlanDayOptions = {
        day: monday,
        workHours: { start: "25:00", end: "18:00" },
        peakHours: bearPeakHours,
        tasks: [createTask()],
      };

      expect(() => planDay(options)).toThrow(/Invalid time values/);
    });
  });

  describe("capacity limits", () => {
    it("should not schedule more tasks than available time", () => {
      // With 10 hours work, 20% buffer = 8 hours available
      // Create tasks totaling 12 hours
      const tasks = [
        createTask({ id: "t1", estimatedDuration: 240 }), // 4h
        createTask({ id: "t2", estimatedDuration: 240 }), // 4h
        createTask({ id: "t3", estimatedDuration: 240 }), // 4h - should be partially scheduled
      ];

      const options: PlanDayOptions = {
        day: monday,
        workHours: defaultWorkHours,
        peakHours: bearPeakHours,
        tasks,
      };

      const result = planDay(options);

      // Calculate total scheduled time (excluding buffer)
      const taskBlocks = result.filter((b) => b.taskId);
      const totalScheduledMinutes = taskBlocks.reduce((acc, block) => {
        const duration =
          (block.endTime.getTime() - block.startTime.getTime()) / (1000 * 60);
        return acc + duration;
      }, 0);

      // Should not exceed available time (480 minutes = 8 hours)
      expect(totalScheduledMinutes).toBeLessThanOrEqual(480);
    });
  });
});
