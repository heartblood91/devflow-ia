import { TimeBlockCard } from "@/components/weekly/TimeBlockCard";
import type { TimeBlockWithTask } from "@/lib/actions/getWeeklyTimeBlocks.action";
import type { Task } from "@/generated/prisma";
import "@testing-library/jest-dom/vitest";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { setup } from "../../test/setup";

const baseMockTask: Task = {
  id: "task-1",
  userId: "user-1",
  title: "Test Task",
  description: "Test Description",
  priority: "important",
  difficulty: 3,
  estimatedDuration: 120,
  status: "inbox",
  kanbanColumn: "inbox",
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

const createMockTimeBlock = (
  overrides: Partial<TimeBlockWithTask> = {},
): TimeBlockWithTask => ({
  id: "block-1",
  userId: "user-1",
  taskId: "task-1",
  date: new Date("2026-01-15"),
  startTime: new Date("2026-01-15T10:00:00"),
  endTime: new Date("2026-01-15T12:00:00"),
  blockType: "important",
  createdAt: new Date(),
  updatedAt: new Date(),
  task: baseMockTask,
  ...overrides,
});

describe("TimeBlockCard", () => {
  it("should display task title", () => {
    const timeBlock = createMockTimeBlock();
    setup(<TimeBlockCard timeBlock={timeBlock} />);

    expect(screen.getByText("Test Task")).toBeInTheDocument();
  });

  it("should display time range", () => {
    const timeBlock = createMockTimeBlock();
    setup(<TimeBlockCard timeBlock={timeBlock} />);

    expect(screen.getByText("10:00 - 12:00")).toBeInTheDocument();
  });

  it("should display 'untitled' when task is null", () => {
    const timeBlock = createMockTimeBlock({ task: null });
    setup(<TimeBlockCard timeBlock={timeBlock} />);

    expect(screen.getByText("Untitled")).toBeInTheDocument();
  });

  it("should truncate long task titles with title attribute", () => {
    const longTitle =
      "This is a very long task title that should be truncated with ellipsis";
    const timeBlock = createMockTimeBlock({
      task: {
        ...baseMockTask,
        title: longTitle,
      },
    });
    setup(<TimeBlockCard timeBlock={timeBlock} />);

    const titleElement = screen.getByTitle(longTitle);
    expect(titleElement).toBeInTheDocument();
  });

  describe("priority colors", () => {
    it("should apply red background for sacred blocks", () => {
      const timeBlock = createMockTimeBlock({ blockType: "sacred" });
      setup(<TimeBlockCard timeBlock={timeBlock} />);

      const card = screen.getByText("Test Task").closest("div");
      expect(card).toHaveClass("bg-red-500");
    });

    it("should apply orange background for important blocks", () => {
      const timeBlock = createMockTimeBlock({ blockType: "important" });
      setup(<TimeBlockCard timeBlock={timeBlock} />);

      const card = screen.getByText("Test Task").closest("div");
      expect(card).toHaveClass("bg-orange-500");
    });

    it("should apply green background for optional blocks", () => {
      const timeBlock = createMockTimeBlock({ blockType: "optional" });
      setup(<TimeBlockCard timeBlock={timeBlock} />);

      const card = screen.getByText("Test Task").closest("div");
      expect(card).toHaveClass("bg-green-500");
    });

    it("should apply gray background and dashed border for buffer blocks", () => {
      const timeBlock = createMockTimeBlock({ blockType: "buffer" });
      setup(<TimeBlockCard timeBlock={timeBlock} />);

      const card = screen.getByText("Test Task").closest("div");
      expect(card).toHaveClass("bg-gray-100");
      expect(card).toHaveClass("border-dashed");
    });

    it("should apply yellow background for rescue blocks", () => {
      const timeBlock = createMockTimeBlock({ blockType: "rescue" });
      setup(<TimeBlockCard timeBlock={timeBlock} />);

      const card = screen.getByText("Test Task").closest("div");
      expect(card).toHaveClass("bg-yellow-400");
    });
  });

  it("should handle different time formats correctly", () => {
    const timeBlock = createMockTimeBlock({
      startTime: new Date("2026-01-15T08:30:00"),
      endTime: new Date("2026-01-15T09:45:00"),
    });
    setup(<TimeBlockCard timeBlock={timeBlock} />);

    expect(screen.getByText("08:30 - 09:45")).toBeInTheDocument();
  });
});
