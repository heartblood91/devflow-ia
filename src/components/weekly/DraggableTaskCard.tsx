"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import type { Task } from "@/generated/prisma";
import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type DraggableTaskCardProps = {
  task: Task;
  isDragging?: boolean;
};

const PRIORITY_EMOJIS = {
  sacred: "🔴",
  important: "🟠",
  optional: "🟢",
} as const;

const PRIORITY_COLORS = {
  sacred: "border-red-500",
  important: "border-orange-500",
  optional: "border-green-500",
} as const;

/**
 * Compact draggable card for tasks in the War Room planning section.
 * Optimized for drag & drop using @dnd-kit/sortable.
 * Features brutal design with thick borders and no rounded corners.
 */
export const DraggableTaskCard = ({
  task,
  isDragging = false,
}: DraggableTaskCardProps) => {
  const t = useTranslations("task");
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityEmoji = PRIORITY_EMOJIS[task.priority];
  const difficultyStars = "⭐".repeat(task.difficulty);
  const priorityColor = PRIORITY_COLORS[task.priority];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      data-testid={`task-card-${task.id}`}
      role="listitem"
      aria-roledescription={t("dragHandle")}
      aria-label={task.title}
      tabIndex={0}
      className={cn(
        "flex flex-col gap-2 rounded-none border-2 bg-white p-3 transition-all hover:border-4 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-950",
        priorityColor,
        isDragging
          ? "cursor-grabbing opacity-50"
          : "cursor-grab hover:shadow-md",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="rounded-none text-xs">
          {priorityEmoji} {task.priority}
        </Badge>
        <Badge variant="secondary" className="rounded-none text-xs">
          {difficultyStars}
        </Badge>
      </div>

      <h4
        className="line-clamp-2 text-sm leading-tight font-semibold"
        title={task.title}
      >
        {task.title}
      </h4>

      <div className="text-muted-foreground flex items-center gap-1 text-xs">
        <Clock className="size-3" aria-hidden="true" />
        <span>
          {task.estimatedDuration} {t("minutes")}
        </span>
      </div>
    </div>
  );
};
