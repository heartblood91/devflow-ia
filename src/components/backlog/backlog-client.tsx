"use client";

import { KanbanBoard } from "@/components/backlog/kanban-board";
import { TaskDialog } from "@/components/backlog/task-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Task } from "@/generated/prisma";
import {
  deleteTaskAction,
  getTasksAction,
  updateTaskColumnAction,
  restoreTaskAction,
} from "@/lib/actions/tasks.action";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { useTranslations } from "next-intl";

type BacklogClientProps = {
  initialTasks: Task[];
};

type Filters = {
  priority: "all" | "sacred" | "important" | "optional";
  kanbanColumn: "all" | "inbox" | "todo" | "doing" | "done";
};

export const BacklogClient = ({ initialTasks }: BacklogClientProps) => {
  const t = useTranslations();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [filters, setFilters] = useState<Filters>({
    priority: "all",
    kanbanColumn: "all",
  });
  const [_isPending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  const router = useRouter();

  // Refetch tasks when dialog closes after success
  const refetchTasks = async () => {
    try {
      const result = await resolveActionResult(getTasksAction({}));
      setTasks(result.tasks);
    } catch {
      toast.error(t("backlog.toast.failedToRefresh"));
    }
  };

  // Sync tasks with initialTasks when they change (after server refresh)
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const filteredTasks = tasks.filter((task) => {
    if (filters.priority !== "all" && task.priority !== filters.priority) {
      return false;
    }
    if (
      filters.kanbanColumn !== "all" &&
      task.kanbanColumn !== filters.kanbanColumn
    ) {
      return false;
    }
    return true;
  });

  const handleTaskEdit = (task: Task) => {
    setSelectedTask(task);
    setIsDialogOpen(true);
  };

  const handleTaskDelete = async (taskId: string) => {
    startTransition(async () => {
      try {
        // Soft delete the task
        await resolveActionResult(deleteTaskAction({ id: taskId }));

        // Optimistically remove from UI
        setTasks((prev) => prev.filter((t) => t.id !== taskId));

        // Show toast with Undo button (10 second duration)
        toast.success(t("backlog.toast.taskDeleted"), {
          duration: 10000,
          action: {
            label: t("backlog.toast.undo"),
            onClick: async () => {
              try {
                await resolveActionResult(restoreTaskAction({ id: taskId }));
                // Refetch tasks to restore the deleted task
                await refetchTasks();
                toast.success(t("backlog.toast.taskRestored"));
              } catch (restoreError) {
                toast.error(
                  restoreError instanceof Error
                    ? restoreError.message
                    : t("backlog.toast.failedToRestore"),
                );
              }
            },
          },
        });
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : t("backlog.toast.failedToDelete"),
        );
      }
    });
  };

  const handleColumnChange = async (
    taskId: string,
    newColumn: "inbox" | "todo" | "doing" | "done",
  ) => {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              kanbanColumn: newColumn,
              status: newColumn,
              completedAt: newColumn === "done" ? new Date() : null,
            }
          : t,
      ),
    );

    // Trigger confetti animation when task is completed
    if (newColumn === "done") {
      void confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    startTransition(async () => {
      try {
        await resolveActionResult(
          updateTaskColumnAction({ id: taskId, kanbanColumn: newColumn }),
        );

        // Show motivational message for completed tasks
        if (newColumn === "done") {
          const motivationalMessages = [
            t("backlog.motivational.awesome"),
            t("backlog.motivational.crushing"),
            t("backlog.motivational.greatJob"),
            t("backlog.motivational.fantastic"),
            t("backlog.motivational.onFire"),
            t("backlog.motivational.lightning"),
            t("backlog.motivational.stellar"),
          ];
          const randomMessage =
            motivationalMessages[
              Math.floor(Math.random() * motivationalMessages.length)
            ];
          toast.success(randomMessage);
        } else {
          toast.success(t("backlog.toast.taskMoved"));
        }
      } catch (error) {
        // Revert on error
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  kanbanColumn:
                    prev.find((task) => task.id === taskId)?.kanbanColumn ??
                    "inbox",
                }
              : t,
          ),
        );
        toast.error(
          error instanceof Error
            ? error.message
            : t("backlog.toast.failedToMove"),
        );
      }
    });
  };

  const handleResetFilters = () => {
    setFilters({ priority: "all", kanbanColumn: "all" });
  };

  const handleCreateTask = () => {
    setSelectedTask(undefined);
    setIsDialogOpen(true);
  };

  const handleDialogSuccess = async () => {
    await refetchTasks();
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Select
            value={filters.priority}
            onValueChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                priority: value as Filters["priority"],
              }))
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t("backlog.filters.priority")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("backlog.filters.allPriorities")}
              </SelectItem>
              <SelectItem value="sacred">
                🔴 {t("backlog.priority.sacred")}
              </SelectItem>
              <SelectItem value="important">
                🟠 {t("backlog.priority.important")}
              </SelectItem>
              <SelectItem value="optional">
                🟢 {t("backlog.priority.optional")}
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.kanbanColumn}
            onValueChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                kanbanColumn: value as Filters["kanbanColumn"],
              }))
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t("backlog.filters.column")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("backlog.filters.allColumns")}
              </SelectItem>
              <SelectItem value="inbox">
                {t("backlog.columns.inbox")}
              </SelectItem>
              <SelectItem value="todo">{t("backlog.columns.todo")}</SelectItem>
              <SelectItem value="doing">
                {t("backlog.columns.doing")}
              </SelectItem>
              <SelectItem value="done">{t("backlog.columns.done")}</SelectItem>
            </SelectContent>
          </Select>

          {(filters.priority !== "all" || filters.kanbanColumn !== "all") && (
            <Button variant="outline" onClick={handleResetFilters}>
              {t("backlog.resetFilters")}
            </Button>
          )}
        </div>

        <Button onClick={handleCreateTask}>
          <Plus className="mr-2 h-4 w-4" />
          {t("backlog.newTask")}
        </Button>
      </div>

      <KanbanBoard
        tasks={filteredTasks}
        onTaskEdit={handleTaskEdit}
        onTaskDelete={handleTaskDelete}
        onColumnChange={handleColumnChange}
        filteredColumn={
          filters.kanbanColumn !== "all" ? filters.kanbanColumn : undefined
        }
      />

      <TaskDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        task={selectedTask}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
};
