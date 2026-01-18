"use client";

import { useDroppable } from "@dnd-kit/core";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type DropZoneProps = {
  day: string;
  time: string;
  children?: ReactNode;
  taskTitle?: string;
};

/**
 * Droppable zone for time slots in the weekly planning preview.
 * Accepts dropped tasks from the backlog list.
 * Uses @dnd-kit/core useDroppable hook for drag & drop functionality.
 */
export const DropZone = ({ day, time, children, taskTitle }: DropZoneProps) => {
  const t = useTranslations("weekly.warRoomModal");
  const tDays = useTranslations("weekly.days");
  const droppableId = `${day}-${time}`;
  const { setNodeRef, isOver, active } = useDroppable({
    id: droppableId,
  });

  const hasTask = !!taskTitle;
  const isDragging = !!active;
  const dayLabel = tDays(day);

  return (
    <div
      ref={setNodeRef}
      data-testid={`drop-zone-${day}-${time}`}
      aria-label={
        hasTask
          ? t("dropZone.occupied", { day: dayLabel, time, task: taskTitle })
          : t("dropZone.empty", { day: dayLabel, time })
      }
      className={cn(
        "flex h-10 items-center justify-center transition-colors",
        hasTask
          ? "border-2 border-gray-400 bg-gray-100 dark:border-gray-600 dark:bg-gray-800"
          : "border-2 border-dashed border-gray-300 dark:border-gray-600",
        isOver &&
          "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950",
        isDragging && !isOver && !hasTask && "border-gray-400",
      )}
    >
      {hasTask ? (
        <span
          className="line-clamp-1 px-2 text-xs font-medium"
          title={taskTitle}
        >
          {taskTitle}
        </span>
      ) : (
        children
      )}
    </div>
  );
};
