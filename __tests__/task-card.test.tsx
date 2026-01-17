import { TaskCard } from "@/components/backlog/task-card";
import type { Task } from "@/generated/prisma";
import "@testing-library/jest-dom/vitest";
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setup } from "../test/setup";

const mockTask: Task = {
  id: "task-1",
  userId: "user-1",
  title: "Test Task",
  description: "Test Description",
  priority: "important",
  difficulty: 3,
  estimatedDuration: 60,
  status: "inbox",
  kanbanColumn: "inbox",
  deadline: new Date("2026-12-31"),
  quarter: "Q1-2026",
  parentTaskId: null,
  dependencies: [],
  weekSkippedCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  completedAt: null,
  deletedAt: null,
  archivedAt: null,
};

describe("TaskCard", () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render task title and description", () => {
    setup(
      <TaskCard task={mockTask} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
    );

    expect(screen.getByText("Test Task")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
  });

  it("should render priority badge", () => {
    setup(
      <TaskCard task={mockTask} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
    );

    // Priority badge with emoji
    expect(screen.getByText(/🟠/)).toBeInTheDocument();
  });

  it("should render difficulty badge", () => {
    setup(
      <TaskCard task={mockTask} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
    );

    // Difficulty with stars
    expect(screen.getByText(/3⭐/)).toBeInTheDocument();
  });

  it("should render estimated duration", () => {
    setup(
      <TaskCard task={mockTask} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
    );

    expect(screen.getByText(/60/)).toBeInTheDocument();
    expect(screen.getByText(/min/)).toBeInTheDocument();
  });

  it("should render deadline when present", () => {
    setup(
      <TaskCard task={mockTask} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
    );

    expect(screen.getByText(/Dec 31, 2026/)).toBeInTheDocument();
  });

  it("should render quarter when present", () => {
    setup(
      <TaskCard task={mockTask} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
    );

    expect(screen.getByText("Q1-2026")).toBeInTheDocument();
  });

  it("should not render description when not provided", () => {
    const taskWithoutDescription = { ...mockTask, description: null };
    setup(
      <TaskCard
        task={taskWithoutDescription}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
    );

    expect(screen.queryByText("Test Description")).not.toBeInTheDocument();
  });

  it("should call onEdit when edit button clicked", async () => {
    const { user } = setup(
      <TaskCard task={mockTask} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
    );

    const editButton = screen.getByRole("button", { name: /edit/i });
    await user.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockTask);
  });

  it("should call onDelete when delete button clicked", async () => {
    const { user } = setup(
      <TaskCard task={mockTask} onEdit={mockOnEdit} onDelete={mockOnDelete} />,
    );

    const deleteButton = screen.getByRole("button", { name: /delete/i });
    await user.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(mockTask.id);
  });

  it("should render sacred priority with red emoji", () => {
    const sacredTask = { ...mockTask, priority: "sacred" as const };
    setup(
      <TaskCard
        task={sacredTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
    );

    expect(screen.getByText(/🔴/)).toBeInTheDocument();
  });

  it("should render optional priority with green emoji", () => {
    const optionalTask = { ...mockTask, priority: "optional" as const };
    setup(
      <TaskCard
        task={optionalTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
    );

    expect(screen.getByText(/🟢/)).toBeInTheDocument();
  });

  it("should show dependencies count when present", () => {
    const taskWithDeps = { ...mockTask, dependencies: ["task-2", "task-3"] };
    setup(
      <TaskCard
        task={taskWithDeps}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
    );

    expect(screen.getByText(/2 dependencies/i)).toBeInTheDocument();
  });
});
