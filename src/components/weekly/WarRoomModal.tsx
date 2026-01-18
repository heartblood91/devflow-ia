"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { DndContext, type DragEndEvent, useDroppable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { getDateFnsLocale } from "@/lib/format/date";
import { RetrospectiveStats } from "./RetrospectiveStats";
import { BacklogTasksList } from "./BacklogTasksList";
import {
  WeeklyPlanningPreview,
  type DroppedTask,
} from "./WeeklyPlanningPreview";
import { getBacklogTasksAction } from "@/lib/actions/getBacklogTasks.action";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import type { Task } from "@/generated/prisma";

type WarRoomModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weekStartDate: Date;
};

/**
 * Droppable container for backlog to enable drag-back functionality.
 * Tasks can be dragged back here from the planning preview.
 */
const BacklogDroppable = ({ children }: { children: React.ReactNode }) => {
  const { setNodeRef, isOver } = useDroppable({ id: "backlog" });

  return (
    <div
      ref={setNodeRef}
      className={`flex h-full flex-col ${isOver ? "ring-2 ring-blue-500" : ""}`}
    >
      {children}
    </div>
  );
};

/**
 * War Room modal for weekly retrospective and planning.
 * Left column: RetrospectiveStats
 * Right column: Planning with drag & drop (BacklogTasksList + WeeklyPlanningPreview)
 */
export const WarRoomModal = ({
  open,
  onOpenChange,
  weekStartDate,
}: WarRoomModalProps) => {
  const t = useTranslations();
  const locale = useLocale();
  const dateFnsLocale = getDateFnsLocale(locale);

  const [droppedTasks, setDroppedTasks] = useState<DroppedTask[]>([]);
  const [backlogTasks, setBacklogTasks] = useState<Task[]>([]);

  // Fetch backlog tasks for task lookup during drag operations
  useEffect(() => {
    if (!open) return;

    let mounted = true;
    const fetchTasks = async () => {
      try {
        const result = await resolveActionResult(getBacklogTasksAction({}));
        if (mounted) {
          setBacklogTasks(result.tasks);
        }
      } catch {
        if (mounted) {
          setBacklogTasks([]);
        }
      }
    };

    void fetchTasks();

    return () => {
      mounted = false;
    };
  }, [open]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setDroppedTasks([]);
    }
  }, [open]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over) return;

      const taskId = active.id as string;
      const overId = over.id as string;

      // Dropping back to backlog - remove from dropped tasks
      if (overId === "backlog") {
        setDroppedTasks((prev) => prev.filter((t) => t.taskId !== taskId));
        return;
      }

      // Check if dropping to a time slot (format: "day-time")
      const dropMatch = overId.match(/^(\w+)-(\d{2}:\d{2})$/);
      if (dropMatch) {
        const [, day, startTime] = dropMatch;

        // Find task from backlog or already dropped tasks
        const task =
          backlogTasks.find((t) => t.id === taskId) ??
          droppedTasks.find((t) => t.taskId === taskId);

        if (!task) return;

        const taskTitle = "title" in task ? task.title : task.taskTitle;

        // Remove from previous position if it was already dropped
        setDroppedTasks((prev) => {
          const filtered = prev.filter((t) => t.taskId !== taskId);
          return [
            ...filtered,
            {
              taskId,
              taskTitle,
              day,
              startTime,
            },
          ];
        });
      }
    },
    [backlogTasks, droppedTasks],
  );

  const formattedDate = format(weekStartDate, "d MMMM yyyy", {
    locale: dateFnsLocale,
  });

  // Get IDs of tasks already in planning preview
  const excludeTaskIds = droppedTasks.map((t) => t.taskId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex !h-[95vh] !w-[95vw] !max-w-[95vw] flex-col overflow-hidden rounded-none border-4 border-black bg-white p-0 lg:!h-[85vh] lg:!w-[70vw] lg:!max-w-[70vw] dark:bg-gray-950"
        aria-describedby={undefined}
      >
        <DialogHeader className="shrink-0 border-b-2 border-black p-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              {t("weekly.warRoomModal.title", { date: formattedDate })}
            </DialogTitle>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label={t("common.close")}
              >
                <X className="size-6" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-5 lg:gap-6">
            {/* Left column: Retrospective Stats - takes 3/5 of space */}
            <div className="flex flex-col gap-4 lg:col-span-3">
              <RetrospectiveStats weekStartDate={weekStartDate} />
            </div>

            {/* Right column: Planning section with DnD - takes 2/5 of space */}
            <div className="flex flex-col gap-4 lg:col-span-2">
              <Card className="flex h-full flex-col rounded-none border-2">
                <CardHeader className="shrink-0 pb-2">
                  <CardTitle>{t("weekly.warRoomModal.planning")}</CardTitle>
                </CardHeader>

                <DndContext onDragEnd={handleDragEnd}>
                  <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4 pt-0">
                    {/* Backlog tasks list - droppable for drag back */}
                    <div className="h-1/2 min-h-[200px]">
                      <BacklogDroppable>
                        <BacklogTasksList excludeTaskIds={excludeTaskIds} />
                      </BacklogDroppable>
                    </div>

                    {/* Weekly planning preview */}
                    <div className="h-1/2 min-h-[200px] overflow-auto">
                      <WeeklyPlanningPreview
                        droppedTasks={droppedTasks}
                        weekStartDate={weekStartDate}
                      />
                    </div>
                  </div>
                </DndContext>
              </Card>
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t-2 border-black p-4">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-none border-2"
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="outline"
              disabled
              className="rounded-none border-2"
              data-testid="generate-planning-btn"
            >
              {t("weekly.warRoomModal.generatePlanning")}
            </Button>
            <Button
              variant="default"
              onClick={() => onOpenChange(false)}
              className="rounded-none border-2"
              data-testid="confirm-planning-btn"
            >
              {t("common.confirm")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
