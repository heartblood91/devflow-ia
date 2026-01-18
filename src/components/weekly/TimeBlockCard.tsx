"use client";

import { format } from "date-fns";
import { useTranslations } from "next-intl";
import type { TimeBlockWithTask } from "@/lib/actions/getWeeklyTimeBlocks.action";
import type { BlockType } from "@/generated/prisma";
import { cn } from "@/lib/utils";

type TimeBlockCardProps = {
  timeBlock: TimeBlockWithTask;
};

/**
 * Block type styles with pastel colors for dark mode.
 * Light mode uses brighter colors for better visibility.
 * Dark mode uses softer pastel variants for less eye strain.
 */
const BLOCK_TYPE_STYLES: Record<BlockType, string> = {
  sacred: "bg-red-500 text-white dark:bg-red-400/70 dark:text-red-50",
  important:
    "bg-orange-500 text-white dark:bg-orange-400/70 dark:text-orange-50",
  optional: "bg-green-500 text-white dark:bg-green-400/70 dark:text-green-50",
  buffer:
    "bg-gray-200 border border-dashed border-gray-400 text-gray-700 dark:bg-gray-600/50 dark:border-gray-500 dark:text-gray-200",
  rescue:
    "bg-yellow-400 text-gray-900 dark:bg-yellow-400/60 dark:text-yellow-50",
};

/**
 * Compact card component for displaying a time block in the weekly grid.
 * Shows task title (multi-line with line-clamp) and time range.
 * Colors are based on block type priority with pastel variants for dark mode.
 */
export const TimeBlockCard = ({ timeBlock }: TimeBlockCardProps) => {
  const t = useTranslations("weekly");
  const startTime = format(new Date(timeBlock.startTime), "HH:mm");
  const endTime = format(new Date(timeBlock.endTime), "HH:mm");

  // Show task title if available, otherwise show block type name
  const displayTitle =
    timeBlock.task?.title ?? t(`blockType.${timeBlock.blockType}`);
  const blockTypeStyle = BLOCK_TYPE_STYLES[timeBlock.blockType];

  return (
    <div
      className={cn(
        "flex h-full flex-col gap-0.5 overflow-hidden rounded p-1.5 text-sm",
        blockTypeStyle,
      )}
    >
      <span
        className="line-clamp-2 text-xs leading-tight font-medium"
        title={displayTitle}
      >
        {displayTitle}
      </span>
      <span className="text-xs opacity-80">
        {startTime} - {endTime}
      </span>
    </div>
  );
};
