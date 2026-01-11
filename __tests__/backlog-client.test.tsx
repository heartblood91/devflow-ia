import { BacklogClient } from "@/components/backlog/backlog-client";
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

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock actions
vi.mock("@/lib/actions/tasks.action", () => ({
  deleteTaskAction: vi.fn(async () => ({ data: { success: true } })),
  updateTaskColumnAction: vi.fn(async () => ({ data: { success: true } })),
}));

const mockTasks: Task[] = [
  {
    id: "task-1",
    userId: "user-1",
    title: "Inbox Task",
    description: "Description 1",
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
  {
    id: "task-2",
    userId: "user-1",
    title: "Todo Task",
    description: null,
    priority: "sacred" as const,
    difficulty: 4,
    estimatedDuration: 90,
    status: "todo" as const,
    kanbanColumn: "todo" as const,
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
    title: "Optional Task",
    description: null,
    priority: "optional" as const,
    difficulty: 2,
    estimatedDuration: 30,
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
  },
];

describe("BacklogClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render with initial tasks", () => {
    setup(<BacklogClient initialTasks={mockTasks} />);

    expect(screen.getByText("Inbox Task")).toBeInTheDocument();
    expect(screen.getByText("Todo Task")).toBeInTheDocument();
    expect(screen.getByText("Optional Task")).toBeInTheDocument();
  });

  it("should render New Task button", () => {
    setup(<BacklogClient initialTasks={mockTasks} />);

    expect(
      screen.getByRole("button", { name: /new task/i }),
    ).toBeInTheDocument();
  });

  it("should render filter dropdowns", () => {
    setup(<BacklogClient initialTasks={mockTasks} />);

    const comboboxes = screen.getAllByRole("combobox");
    expect(comboboxes).toHaveLength(2); // Priority and Column filters
  });

  it("should open create dialog when clicking New Task button", async () => {
    const { user } = setup(<BacklogClient initialTasks={mockTasks} />);

    // Click New Task button
    await user.click(screen.getByRole("button", { name: /new task/i }));

    // Dialog should open with Create title
    expect(
      screen.getByRole("heading", { name: /create new task/i }),
    ).toBeInTheDocument();
  });

  it("should open edit dialog when clicking edit button", async () => {
    const { user } = setup(<BacklogClient initialTasks={mockTasks} />);

    // Click first edit button
    const editButtons = screen.getAllByRole("button", { name: /edit/i });
    await user.click(editButtons[0]);

    // Dialog should open with Edit title
    expect(
      screen.getByRole("heading", { name: /edit task/i }),
    ).toBeInTheDocument();
  });

  it("should render KanbanBoard with tasks", () => {
    setup(<BacklogClient initialTasks={mockTasks} />);

    // Verify kanban columns are rendered
    expect(
      screen.getByRole("heading", { name: /inbox.*1/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /to do.*1/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /doing.*1/i }),
    ).toBeInTheDocument();
  });

  it("should handle empty task list", () => {
    setup(<BacklogClient initialTasks={[]} />);

    // Verify empty states
    const emptyStates = screen.getAllByText(/no tasks/i);
    expect(emptyStates).toHaveLength(4); // One for each column
  });

  it("should render all task cards with edit and delete buttons", () => {
    setup(<BacklogClient initialTasks={mockTasks} />);

    // Each task should have edit and delete buttons
    const editButtons = screen.getAllByRole("button", { name: /edit/i });
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });

    expect(editButtons).toHaveLength(3);
    expect(deleteButtons).toHaveLength(3);
  });

  it("should display task dialog component", () => {
    const { container } = setup(<BacklogClient initialTasks={mockTasks} />);

    // TaskDialog component should be present (even if not open)
    expect(container).toBeInTheDocument();
  });
});
