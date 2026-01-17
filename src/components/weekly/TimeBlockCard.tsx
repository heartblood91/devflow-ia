"use client";

import { format } from "date-fns";
import { useTranslations } from "next-intl";
import type { TimeBlockWithTask } from "@/lib/actions/getWeeklyTimeBlocks.action";

type TimeBlockCardProps = {
  timeBlock: TimeBlockWithTask;
};

/**
 * Compact card component for displaying a time block in the weekly grid.
 * Shows task title (with ellipsis) and time range.
 */
export const TimeBlockCard = ({ timeBlock }: TimeBlockCardProps) => {
  const t = useTranslations("weekly");
  const startTime = format(new Date(timeBlock.startTime), "HH:mm");
  const endTime = format(new Date(timeBlock.endTime), "HH:mm");

  const taskTitle = timeBlock.task?.title ?? t("untitled");

  return (
    <div className="bg-muted/80 flex h-full flex-col gap-0.5 overflow-hidden rounded p-1.5 text-sm">
      <span className="truncate text-xs font-medium" title={taskTitle}>
        {taskTitle}
      </span>
      <span className="text-muted-foreground text-xs">
        {startTime} - {endTime}
      </span>
    </div>
  );
};
