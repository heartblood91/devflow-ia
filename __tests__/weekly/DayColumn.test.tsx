import { DayColumn } from "@/components/weekly/DayColumn";
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

const workHours = {
  start: 8,
  end: 19,
};

describe("DayColumn", () => {
  const testDay = new Date("2026-01-15");

  it("should render empty column when no time blocks", () => {
    const { container } = setup(
      <DayColumn day={testDay} timeBlocks={[]} workHours={workHours} />,
    );

    const column = container.querySelector("div.relative");
    expect(column).toBeInTheDocument();
    expect(column?.children.length).toBe(0);
  });

  it("should render time blocks", () => {
    const timeBlock = createMockTimeBlock();
    setup(
      <DayColumn
        day={testDay}
        timeBlocks={[timeBlock]}
        workHours={workHours}
      />,
    );

    expect(screen.getByText("Test Task")).toBeInTheDocument();
  });

  it("should position block at correct top offset based on start time", () => {
    // Block starts at 10:00, work hours start at 8:00
    // Offset = (10 - 8) * 64 = 128px
    const timeBlock = createMockTimeBlock({
      startTime: new Date("2026-01-15T10:00:00"),
    });

    const { container } = setup(
      <DayColumn
        day={testDay}
        timeBlocks={[timeBlock]}
        workHours={workHours}
      />,
    );

    const blockWrapper = container.querySelector(".absolute.right-0\\.5");
    expect(blockWrapper).toHaveStyle({ top: "128px" });
  });

  it("should calculate correct height based on duration", () => {
    // Block is 2 hours (10:00 - 12:00)
    // Height = 2 * 64 = 128px
    const timeBlock = createMockTimeBlock({
      startTime: new Date("2026-01-15T10:00:00"),
      endTime: new Date("2026-01-15T12:00:00"),
    });

    const { container } = setup(
      <DayColumn
        day={testDay}
        timeBlocks={[timeBlock]}
        workHours={workHours}
      />,
    );

    const blockWrapper = container.querySelector(".absolute.right-0\\.5");
    expect(blockWrapper).toHaveStyle({ height: "128px" });
  });

  it("should position block with fractional hours correctly", () => {
    // Block starts at 10:30, work hours start at 8:00
    // Offset = (10 - 8 + 30/60) * 64 = 2.5 * 64 = 160px
    const timeBlock = createMockTimeBlock({
      startTime: new Date("2026-01-15T10:30:00"),
      endTime: new Date("2026-01-15T11:30:00"),
    });

    const { container } = setup(
      <DayColumn
        day={testDay}
        timeBlocks={[timeBlock]}
        workHours={workHours}
      />,
    );

    const blockWrapper = container.querySelector(".absolute.right-0\\.5");
    expect(blockWrapper).toHaveStyle({ top: "160px" });
  });

  it("should apply minimum height for short blocks", () => {
    // Block is 15 minutes (0.25 hours)
    // Calculated height = 0.25 * 64 = 16px, but minimum is 32px
    const timeBlock = createMockTimeBlock({
      startTime: new Date("2026-01-15T10:00:00"),
      endTime: new Date("2026-01-15T10:15:00"),
    });

    const { container } = setup(
      <DayColumn
        day={testDay}
        timeBlocks={[timeBlock]}
        workHours={workHours}
      />,
    );

    const blockWrapper = container.querySelector(".absolute.right-0\\.5");
    expect(blockWrapper).toHaveStyle({ height: "32px" });
  });

  it("should render multiple time blocks", () => {
    const timeBlocks = [
      createMockTimeBlock({
        id: "block-1",
        task: { ...baseMockTask, title: "Task 1" },
        startTime: new Date("2026-01-15T09:00:00"),
        endTime: new Date("2026-01-15T10:00:00"),
      }),
      createMockTimeBlock({
        id: "block-2",
        task: { ...baseMockTask, title: "Task 2" },
        startTime: new Date("2026-01-15T14:00:00"),
        endTime: new Date("2026-01-15T15:30:00"),
      }),
    ];

    setup(
      <DayColumn day={testDay} timeBlocks={timeBlocks} workHours={workHours} />,
    );

    expect(screen.getByText("Task 1")).toBeInTheDocument();
    expect(screen.getByText("Task 2")).toBeInTheDocument();
  });

  it("should set column height based on total work hours", () => {
    // Total hours = 19 - 8 + 1 = 12 hours
    // Height = 12 * 64 = 768px
    const { container } = setup(
      <DayColumn day={testDay} timeBlocks={[]} workHours={workHours} />,
    );

    const column = container.querySelector("div.relative");
    expect(column).toHaveStyle({ height: "768px" });
  });

  it("should handle block starting at work hours start", () => {
    // Block starts at 8:00 (work hours start)
    // Offset = 0px
    const timeBlock = createMockTimeBlock({
      startTime: new Date("2026-01-15T08:00:00"),
      endTime: new Date("2026-01-15T09:00:00"),
    });

    const { container } = setup(
      <DayColumn
        day={testDay}
        timeBlocks={[timeBlock]}
        workHours={workHours}
      />,
    );

    const blockWrapper = container.querySelector(".absolute.right-0\\.5");
    expect(blockWrapper).toHaveStyle({ top: "0px" });
    expect(blockWrapper).toHaveStyle({ height: "64px" });
  });
});
