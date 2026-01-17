"use client";

import { format } from "date-fns";
import { useTranslations } from "next-intl";
import type { TimeBlockWithTask } from "@/lib/actions/getWeeklyTimeBlocks.action";
import type { BlockType } from "@/generated/prisma";
import { cn } from "@/lib/utils";

type TimeBlockCardProps = {
  timeBlock: TimeBlockWithTask;
};

const BLOCK_TYPE_STYLES: Record<BlockType, string> = {
  sacred: "bg-red-500 text-white",
  important: "bg-orange-500 text-white",
  optional: "bg-green-500 text-white",
  buffer: "bg-gray-100 border border-dashed border-gray-400 text-gray-700",
  rescue: "bg-yellow-400 text-gray-900",
};

/**
 * Compact card component for displaying a time block in the weekly grid.
 * Shows task title (with ellipsis) and time range.
 * Colors are based on block type priority.
 */
export const TimeBlockCard = ({ timeBlock }: TimeBlockCardProps) => {
  const t = useTranslations("weekly");
  const startTime = format(new Date(timeBlock.startTime), "HH:mm");
  const endTime = format(new Date(timeBlock.endTime), "HH:mm");

  const taskTitle = timeBlock.task?.title ?? t("untitled");
  const blockTypeStyle = BLOCK_TYPE_STYLES[timeBlock.blockType];

  return (
    <div
      className={cn(
        "flex h-full flex-col gap-0.5 overflow-hidden rounded p-1.5 text-sm",
        blockTypeStyle,
      )}
    >
      <span className="truncate text-xs font-medium" title={taskTitle}>
        {taskTitle}
      </span>
      <span className="text-xs opacity-80">
        {startTime} - {endTime}
      </span>
    </div>
  );
};
