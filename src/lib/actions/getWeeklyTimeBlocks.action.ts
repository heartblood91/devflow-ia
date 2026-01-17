"use server";

/**
 * Server Action for fetching weekly time blocks
 *
 * Retrieves all time blocks for a given week, grouped by day.
 */

import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import type { TimeBlock, Task } from "@/generated/prisma";
import { startOfWeek, endOfWeek, getDay } from "date-fns";
import { GetWeeklyTimeBlocksSchema } from "./getWeeklyTimeBlocks.schema";

export type TimeBlockWithTask = TimeBlock & {
  task: Task | null;
};

export type WeeklyTimeBlocks = {
  monday: TimeBlockWithTask[];
  tuesday: TimeBlockWithTask[];
  wednesday: TimeBlockWithTask[];
  thursday: TimeBlockWithTask[];
  friday: TimeBlockWithTask[];
  saturday: TimeBlockWithTask[];
  sunday: TimeBlockWithTask[];
};

const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export const getWeeklyTimeBlocksAction = authAction
  .inputSchema(GetWeeklyTimeBlocksSchema)
  .action(async ({ parsedInput: { weekStart }, ctx: { user } }) => {
    const weekStartDate = new Date(weekStart);

    const weekBegin = startOfWeek(weekStartDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(weekStartDate, { weekStartsOn: 1 });

    const timeBlocks = await prisma.timeBlock.findMany({
      where: {
        userId: user.id,
        date: {
          gte: weekBegin,
          lte: weekEnd,
        },
      },
      include: {
        task: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    const grouped: WeeklyTimeBlocks = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    };

    for (const block of timeBlocks) {
      const dayIndex = getDay(block.date);
      const dayName = DAY_NAMES[dayIndex];
      grouped[dayName].push(block);
    }

    return grouped;
  });
