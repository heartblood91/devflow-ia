import { KanbanBoard } from "@/components/backlog/kanban-board";
import type { Task } from "@/generated/prisma";
import "@testing-library/jest-dom/vitest";
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setup } from "../test/setup";

// Mock @hello-pangea/dnd to avoid drag-and-drop interference in tests
/* eslint-disable */
vi.mock("@hello-pangea/dnd", () => {
  return {
    DragDropContext: ({ children }: { children: React.ReactNode }) => {
      return children;
    },
    Droppable: ({
      children,
    }: {
      children: (
        provided: {
          innerRef: ReturnType<typeof vi.fn>;
          droppableProps: Record<string, unknown>;
          placeholder: null;
        },
        snapshot: { isDraggingOver: boolean },
      ) => React.ReactNode;
    }) => {
      return children(
        {
          innerRef: vi.fn(),
          droppableProps: {},
          placeholder: null,
        },
        { isDraggingOver: false },
      );
    },
    Draggable: ({
      children,
    }: {
      children: (
        provided: {
          innerRef: ReturnType<typeof vi.fn>;
          draggableProps: Record<string, unknown>;
          dragHandleProps: Record<string, unknown>;
        },
        snapshot: { isDragging: boolean },
      ) => React.ReactNode;
    }) => {
      return children(
        {
          innerRef: vi.fn(),
          draggableProps: {},
          dragHandleProps: {},
        },
        { isDragging: false },
      );
    },
  };
});
/* eslint-enable */

const mockTasks: Task[] = [
  {
    id: "task-1",
    userId: "user-1",
    title: "Inbox Task",
    description: null,
    priority: "important",
    difficulty: 3,
    estimatedDuration: 60,
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
  },
  {
    id: "task-2",
    userId: "user-1",
    title: "Todo Task",
    description: null,
    priority: "sacred",
    difficulty: 4,
    estimatedDuration: 90,
    status: "todo",
    kanbanColumn: "todo",
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
  {
    id: "task-3",
    userId: "user-1",
    title: "Doing Task",
    description: null,
    priority: "optional",
    difficulty: 2,
    estimatedDuration: 30,
    status: "doing",
    kanbanColumn: "doing",
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
  {
    id: "task-4",
    userId: "user-1",
    title: "Done Task",
    description: null,
    priority: "important",
    difficulty: 3,
    estimatedDuration: 45,
    status: "done",
    kanbanColumn: "done",
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
  },
];

describe("KanbanBoard", () => {
  const mockOnTaskEdit = vi.fn();
  const mockOnTaskDelete = vi.fn();
  const mockOnColumnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render all four columns", () => {
    setup(
      <KanbanBoard
        tasks={mockTasks}
        onTaskEdit={mockOnTaskEdit}
        onTaskDelete={mockOnTaskDelete}
        onColumnChange={mockOnColumnChange}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /inbox.*1/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /to do.*1/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /doing.*1/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /done.*1/i }),
    ).toBeInTheDocument();
  });

  it("should render tasks in correct columns", () => {
    setup(
      <KanbanBoard
        tasks={mockTasks}
        onTaskEdit={mockOnTaskEdit}
        onTaskDelete={mockOnTaskDelete}
        onColumnChange={mockOnColumnChange}
      />,
    );

    expect(screen.getByText("Inbox Task")).toBeInTheDocument();
    expect(screen.getByText("Todo Task")).toBeInTheDocument();
    expect(screen.getByText("Doing Task")).toBeInTheDocument();
    expect(screen.getByText("Done Task")).toBeInTheDocument();
  });

  it("should show empty state when column has no tasks", () => {
    const emptyTasks: Task[] = [];
    setup(
      <KanbanBoard
        tasks={emptyTasks}
        onTaskEdit={mockOnTaskEdit}
        onTaskDelete={mockOnTaskDelete}
        onColumnChange={mockOnColumnChange}
      />,
    );

    const emptyStates = screen.getAllByText(/no tasks/i);
    expect(emptyStates).toHaveLength(4); // One for each column
  });

  it("should show task count for each column", () => {
    setup(
      <KanbanBoard
        tasks={mockTasks}
        onTaskEdit={mockOnTaskEdit}
        onTaskDelete={mockOnTaskDelete}
        onColumnChange={mockOnColumnChange}
      />,
    );

    // Each column should show count
    expect(screen.getByText(/inbox.*1/i)).toBeInTheDocument();
    expect(screen.getByText(/to do.*1/i)).toBeInTheDocument();
    expect(screen.getByText(/doing.*1/i)).toBeInTheDocument();
    expect(screen.getByText(/done.*1/i)).toBeInTheDocument();
  });

  it("should pass onTaskEdit to TaskCard", async () => {
    const { user } = setup(
      <KanbanBoard
        tasks={mockTasks}
        onTaskEdit={mockOnTaskEdit}
        onTaskDelete={mockOnTaskDelete}
        onColumnChange={mockOnColumnChange}
      />,
    );

    // Find the first edit button and click it
    const editButtons = screen.getAllByRole("button", { name: /edit/i });
    await user.click(editButtons[0]);

    expect(mockOnTaskEdit).toHaveBeenCalled();
  });

  it("should pass onTaskDelete to TaskCard", async () => {
    const { user } = setup(
      <KanbanBoard
        tasks={mockTasks}
        onTaskEdit={mockOnTaskEdit}
        onTaskDelete={mockOnTaskDelete}
        onColumnChange={mockOnColumnChange}
      />,
    );

    // Find the first delete button and click it
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    await user.click(deleteButtons[0]);

    expect(mockOnTaskDelete).toHaveBeenCalled();
  });

  it("should render with tasks only in inbox column", () => {
    const inboxOnlyTasks = mockTasks.filter((t) => t.kanbanColumn === "inbox");
    setup(
      <KanbanBoard
        tasks={inboxOnlyTasks}
        onTaskEdit={mockOnTaskEdit}
        onTaskDelete={mockOnTaskDelete}
        onColumnChange={mockOnColumnChange}
      />,
    );

    expect(screen.getByText("Inbox Task")).toBeInTheDocument();
    expect(screen.queryByText("Todo Task")).not.toBeInTheDocument();
  });
});
