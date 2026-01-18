/**
 * Plan Day Algorithm
 *
 * Distributes tasks throughout a single day based on difficulty,
 * peak hours, and available time capacity. Follows chronotype-based
 * scheduling to optimize for deep work during biological peak hours.
 */

import { addMinutes, format, setHours, setMinutes } from "date-fns";
import type { PeakHour } from "./getPeakHours";

export type BlockType =
  | "sacred"
  | "important"
  | "optional"
  | "buffer"
  | "rescue";

export type TimeBlock = {
  date: Date;
  startTime: Date;
  endTime: Date;
  blockType: BlockType;
  taskId?: string;
  taskTitle?: string;
};

export type TaskForPlanning = {
  id: string;
  title: string;
  difficulty: number; // 1-5
  estimatedDuration: number; // minutes
  priority: "sacred" | "important" | "optional";
};

export type PlanDayOptions = {
  day: Date;
  workHours: { start: string; end: string }; // e.g., { start: "08:00", end: "18:00" }
  peakHours: PeakHour[];
  tasks: TaskForPlanning[];
  bufferPercentage?: number; // default 20%
};

/**
 * Parse time string (HH:mm) and apply it to a given date
 */
const parseTimeOnDate = (date: Date, timeStr: string): Date => {
  const parts = timeStr.split(":");
  if (parts.length !== 2) {
    throw new Error(`Invalid time format: ${timeStr}. Expected HH:mm`);
  }

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error(
      `Invalid time values: ${timeStr}. Hours must be 0-23, minutes 0-59`,
    );
  }

  return setMinutes(setHours(date, hours), minutes);
};

/**
 * Check if a time falls within peak hours
 */
const isInPeakHours = (time: Date, peakHours: PeakHour[]): boolean => {
  const timeStr = format(time, "HH:mm");
  return peakHours.some((peak) => timeStr >= peak.start && timeStr < peak.end);
};

// Constants for peak hour search
const MAX_PEAK_SEARCH_MINUTES = 480; // Don't search beyond 8 hours ahead
const PEAK_SEARCH_INTERVAL_MINUTES = 30; // Check every 30 minutes

/**
 * Plan a single day's time blocks
 *
 * Algorithm:
 * 1. Calculate available minutes (work hours - buffer)
 * 2. Sort tasks: difficult first (4-5 stars), then medium (3), then easy (1-2)
 * 3. Place difficult tasks on peak hours
 * 4. Place medium tasks on normal hours
 * 5. Place easy tasks on remaining hours
 * 6. Add buffer time slot at end
 *
 * @param options - Planning configuration
 * @returns Array of TimeBlock objects for the day
 */
export const planDay = (options: PlanDayOptions): TimeBlock[] => {
  const { day, workHours, peakHours, tasks, bufferPercentage = 20 } = options;

  const timeBlocks: TimeBlock[] = [];

  if (tasks.length === 0) {
    return timeBlocks;
  }

  // Parse work hours
  const workStart = parseTimeOnDate(day, workHours.start);
  const workEnd = parseTimeOnDate(day, workHours.end);

  if (workEnd <= workStart) {
    throw new Error(
      `Invalid work hours: end time (${workHours.end}) must be after start time (${workHours.start})`,
    );
  }

  const totalWorkMinutes =
    (workEnd.getTime() - workStart.getTime()) / (1000 * 60);

  // Calculate buffer
  const bufferMinutes = Math.floor(totalWorkMinutes * (bufferPercentage / 100));
  const availableMinutes = totalWorkMinutes - bufferMinutes;

  // Sort tasks by difficulty (difficult → easy)
  const sortedTasks = [...tasks].sort((a, b) => b.difficulty - a.difficulty);

  // Categorize tasks
  const difficultTasks = sortedTasks.filter((t) => t.difficulty >= 4);
  const mediumTasks = sortedTasks.filter((t) => t.difficulty === 3);
  const easyTasks = sortedTasks.filter((t) => t.difficulty <= 2);

  let currentTime = workStart;
  let remainingMinutes = availableMinutes;

  // Helper: Create a time block
  const createBlock = (task: TaskForPlanning, start: Date): TimeBlock => {
    const duration = Math.min(task.estimatedDuration, remainingMinutes);
    const end = addMinutes(start, duration);

    const block: TimeBlock = {
      date: day,
      startTime: start,
      endTime: end,
      blockType: task.priority as BlockType,
      taskId: task.id,
      taskTitle: task.title,
    };

    remainingMinutes -= duration;
    return block;
  };

  // Place difficult tasks on peak hours first
  for (const task of difficultTasks) {
    if (remainingMinutes <= 0) break;

    // Try to place during peak hours
    if (isInPeakHours(currentTime, peakHours)) {
      const block = createBlock(task, currentTime);
      timeBlocks.push(block);
      currentTime = block.endTime;
    } else {
      // Find next peak hour within work day
      let foundPeak = false;
      let checkTime = currentTime;

      for (
        let i = 0;
        i < MAX_PEAK_SEARCH_MINUTES;
        i += PEAK_SEARCH_INTERVAL_MINUTES
      ) {
        if (checkTime >= workEnd) {
          break; // Don't search beyond work end time
        }
        if (isInPeakHours(checkTime, peakHours)) {
          currentTime = checkTime;
          const block = createBlock(task, currentTime);
          timeBlocks.push(block);
          currentTime = block.endTime;
          foundPeak = true;
          break;
        }
        checkTime = addMinutes(checkTime, PEAK_SEARCH_INTERVAL_MINUTES);
      }

      // If no peak found, place anyway at current time
      if (!foundPeak) {
        const block = createBlock(task, currentTime);
        timeBlocks.push(block);
        currentTime = block.endTime;
      }
    }
  }

  // Place medium tasks on normal hours
  for (const task of mediumTasks) {
    if (remainingMinutes <= 0) break;
    const block = createBlock(task, currentTime);
    timeBlocks.push(block);
    currentTime = block.endTime;
  }

  // Place easy tasks on remaining hours
  for (const task of easyTasks) {
    if (remainingMinutes <= 0) break;
    const block = createBlock(task, currentTime);
    timeBlocks.push(block);
    currentTime = block.endTime;
  }

  // Add buffer time slot at end if there's time left
  if (bufferMinutes > 0 && currentTime < workEnd) {
    const bufferEnd = addMinutes(
      currentTime,
      Math.min(bufferMinutes, remainingMinutes),
    );
    timeBlocks.push({
      date: day,
      startTime: currentTime,
      endTime: bufferEnd,
      blockType: "buffer",
    });
  }

  return timeBlocks;
};
