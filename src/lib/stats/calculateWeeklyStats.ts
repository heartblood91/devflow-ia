/**
 * Weekly Statistics Calculation
 *
 * Calculates weekly productivity metrics for the War Room retrospective.
 */

import { prisma } from "@/lib/prisma";
import { addDays } from "date-fns";

export type WeeklyStats = {
  completedTasks: number;
  totalTasks: number;
  skippedTasks: number;
  totalHours: number;
  maxHours: number;
  rescueUsed: number;
  rescueMax: number;
  avgFocusQuality: number;
  avgEnergyLevel: number;
};

/**
 * Calculate weekly statistics for a user
 *
 * @param userId - The user ID to calculate stats for
 * @param weekStartDate - The start date of the week (Monday)
 * @returns WeeklyStats object with all calculated metrics
 */
export const calculateWeeklyStats = async (
  userId: string,
  weekStartDate: Date,
): Promise<WeeklyStats> => {
  const weekEndDate = addDays(weekStartDate, 7);

  // Fetch tasks for the week
  // Tasks that were either created this week OR have time blocks scheduled this week
  const tasksWithTimeBlocks = await prisma.task.findMany({
    where: {
      userId,
      deletedAt: null,
      archivedAt: null,
      timeBlocks: {
        some: {
          date: {
            gte: weekStartDate,
            lt: weekEndDate,
          },
        },
      },
    },
    include: {
      timeBlocks: {
        where: {
          date: {
            gte: weekStartDate,
            lt: weekEndDate,
          },
        },
      },
    },
  });

  const completedTasks = tasksWithTimeBlocks.filter(
    (task) => task.status === "done",
  ).length;
  const totalTasks = tasksWithTimeBlocks.length;
  const skippedTasks = totalTasks - completedTasks;

  // Fetch all time blocks for the week
  const timeBlocks = await prisma.timeBlock.findMany({
    where: {
      userId,
      date: {
        gte: weekStartDate,
        lt: weekEndDate,
      },
    },
  });

  // Calculate total hours from working time blocks (excluding buffer/free time)
  const workingBlocks = timeBlocks.filter(
    (block) => block.blockType !== "buffer" && block.blockType !== "rescue",
  );

  const totalMinutes = workingBlocks.reduce((acc, block) => {
    const start = new Date(block.startTime);
    const end = new Date(block.endTime);
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    // Ensure non-negative duration (defensive check for data integrity)
    return acc + Math.max(0, durationMinutes);
  }, 0);

  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

  // Calculate rescue slots used
  const rescueBlocks = timeBlocks.filter(
    (block) => block.blockType === "rescue",
  );
  const rescueUsed = rescueBlocks.length;

  // DailyReflection model not yet implemented
  // TODO: Calculate avgFocusQuality and avgEnergyLevel when DailyReflection is added
  const avgFocusQuality = 0;
  const avgEnergyLevel = 0;

  return {
    completedTasks,
    totalTasks,
    skippedTasks,
    totalHours,
    maxHours: 20,
    rescueUsed,
    rescueMax: 2,
    avgFocusQuality,
    avgEnergyLevel,
  };
};
