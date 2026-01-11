"use client";

import { TaskCard } from "@/components/backlog/task-card";
import type { Task } from "@/generated/prisma";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

type KanbanColumn = "inbox" | "todo" | "doing" | "done";

type KanbanBoardProps = {
  tasks: Task[];
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onColumnChange: (taskId: string, newColumn: KanbanColumn) => void;
  filteredColumn?: KanbanColumn;
};

type KanbanColumnProps = {
  column: KanbanColumn;
  tasks: Task[];
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
};

const KanbanColumnComponent = ({
  column,
  tasks,
  onTaskEdit,
  onTaskDelete,
}: KanbanColumnProps) => {
  const t = useTranslations();
  const [isArchiveExpanded, setIsArchiveExpanded] = useState(false);
  const [archivePage, setArchivePage] = useState(1);
  const ARCHIVE_PAGE_SIZE = 10;

  const COLUMN_LABELS: Record<KanbanColumn, string> = {
    inbox: t("backlog.columns.inbox"),
    todo: t("backlog.columns.todo"),
    doing: t("backlog.columns.doing"),
    done: t("backlog.columns.done"),
  };

  // For Done column, separate active and archived tasks
  const allColumnTasks = tasks.filter((t) => t.kanbanColumn === column);
  const activeTasks = allColumnTasks.filter((t) => !t.archivedAt);
  const archivedTasks = allColumnTasks.filter((t) => t.archivedAt);

  // Paginate archived tasks
  const totalArchivePages = Math.ceil(archivedTasks.length / ARCHIVE_PAGE_SIZE);
  const paginatedArchivedTasks = archivedTasks.slice(
    (archivePage - 1) * ARCHIVE_PAGE_SIZE,
    archivePage * ARCHIVE_PAGE_SIZE,
  );

  const columnTasks = column === "done" ? activeTasks : allColumnTasks;

  return (
    <div
      data-testid={`kanban-column-${column}`}
      className="flex min-h-[500px] flex-col rounded-lg border bg-gray-50 p-4 dark:bg-gray-900"
    >
      <h2
        data-testid={`kanban-column-heading-${column}`}
        className="mb-4 text-lg font-semibold"
      >
        {COLUMN_LABELS[column]} ({columnTasks.length})
      </h2>

      <Droppable droppableId={column}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            data-testid={`kanban-droppable-${column}`}
            className={`flex-1 space-y-4 rounded-lg p-2 transition-colors ${
              snapshot.isDraggingOver ? "bg-blue-50 dark:bg-blue-950" : ""
            }`}
          >
            {columnTasks.length === 0 ? (
              <div className="text-muted-foreground min-h-[100px] text-center text-sm">
                {t("backlog.noTasks")}
              </div>
            ) : (
              columnTasks.map((task, index) => (
                <Draggable key={task.id} draggableId={task.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      data-testid={`kanban-task-${task.id}`}
                      className={`${snapshot.isDragging ? "opacity-50" : ""}`}
                    >
                      <TaskCard
                        task={task}
                        onEdit={onTaskEdit}
                        onDelete={onTaskDelete}
                      />
                    </div>
                  )}
                </Draggable>
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Archives Section - Only for Done column */}
      {column === "done" && archivedTasks.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <Button
            variant="ghost"
            className="mb-2 w-full justify-start text-sm"
            onClick={() => setIsArchiveExpanded(!isArchiveExpanded)}
          >
            {isArchiveExpanded ? (
              <ChevronDown className="mr-2 h-4 w-4" />
            ) : (
              <ChevronRight className="mr-2 h-4 w-4" />
            )}
            {t("backlog.archives.title")} ({archivedTasks.length})
          </Button>

          {isArchiveExpanded && (
            <div className="space-y-4">
              {paginatedArchivedTasks.map((task) => (
                <div key={task.id} className="opacity-60">
                  <TaskCard
                    task={task}
                    onEdit={onTaskEdit}
                    onDelete={onTaskDelete}
                  />
                </div>
              ))}

              {/* Pagination Controls */}
              {totalArchivePages > 1 && (
                <div className="flex items-center justify-between gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setArchivePage((p) => Math.max(1, p - 1))}
                    disabled={archivePage === 1}
                  >
                    {t("common.previous")}
                  </Button>
                  <span className="text-sm">
                    {t("common.page")} {archivePage} {t("common.of")}{" "}
                    {totalArchivePages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setArchivePage((p) => Math.min(totalArchivePages, p + 1))
                    }
                    disabled={archivePage === totalArchivePages}
                  >
                    {t("common.next")}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const KanbanBoard = ({
  tasks,
  onTaskEdit,
  onTaskDelete,
  onColumnChange,
  filteredColumn,
}: KanbanBoardProps) => {
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Dropped outside any droppable
    if (!destination) return;

    // Dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Column changed
    if (destination.droppableId !== source.droppableId) {
      const newColumn = destination.droppableId as KanbanColumn;
      onColumnChange(draggableId, newColumn);
    }
  };

  const columns: KanbanColumn[] = filteredColumn
    ? [filteredColumn]
    : ["inbox", "todo", "doing", "done"];

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div
        className={
          filteredColumn
            ? "mx-auto max-w-2xl"
            : "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
        }
      >
        {columns.map((column) => (
          <KanbanColumnComponent
            key={column}
            column={column}
            tasks={tasks}
            onTaskEdit={onTaskEdit}
            onTaskDelete={onTaskDelete}
          />
        ))}
      </div>
    </DragDropContext>
  );
};
