/**
 * Generate Weekly Planning Use Case
 *
 * Orchestrates the weekly planning algorithm:
 * 1. Fetches plannable tasks (sacred + important, not already planned)
 * 2. Applies chronotype-based scheduling with peak hours
 * 3. Distributes tasks across Mon-Fri using planDay algorithm
 * 4. Adds rescue slots on Friday afternoon
 * 5. Returns planning preview (not saved to DB yet)
 */

import { prisma } from "@/lib/prisma";
import { addDays, setHours, setMinutes, startOfWeek } from "date-fns";
import { getPeakHours } from "@/lib/stats/getPeakHours";
import {
  planDay,
  type TimeBlock,
  type TaskForPlanning,
} from "@/lib/stats/planDay";

export type GenerateWeeklyPlanningInput = {
  userId: string;
  weekStartDate: Date; // Monday of the week
};

export type GenerateWeeklyPlanningOutput = {
  timeBlocks: TimeBlock[];
  totalHours: number;
  bufferHours: number;
  rescueSlots: number;
};

// Default preferences until UserPreferences table is implemented
const DEFAULT_CHRONOTYPE = "bear";
const DEFAULT_WORK_HOURS = { start: "08:00", end: "18:00" };
const DEFAULT_BUFFER_PERCENTAGE = 20;
const RESCUE_SLOT_DAY = 4; // Friday (0 = Monday)
const RESCUE_SLOT_START_HOUR = 16;
const RESCUE_SLOT_END_HOUR = 18;

type TaskWithDeps = TaskForPlanning & { dependencies: string[] };

/**
 * Sort tasks to respect dependencies (topological sort)
 * Tasks with no dependencies come first, then tasks whose dependencies are scheduled
 */
const sortByDependencies = (tasks: TaskWithDeps[]): TaskForPlanning[] => {
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const sorted: TaskForPlanning[] = [];
  const visited = new Set<string>();
  const inProgress = new Set<string>();

  const visit = (taskId: string): void => {
    if (visited.has(taskId)) return;
    if (inProgress.has(taskId)) {
      // Circular dependency - skip to prevent infinite loop
      return;
    }

    const task = taskMap.get(taskId);
    if (!task) return;

    inProgress.add(taskId);

    // Visit dependencies first (only if they exist in our task list)
    for (const depId of task.dependencies) {
      if (taskMap.has(depId)) {
        visit(depId);
      }
    }

    inProgress.delete(taskId);
    visited.add(taskId);

    // Add task without dependencies field for TaskForPlanning
    const { dependencies: _deps, ...taskForPlanning } = task;
    sorted.push(taskForPlanning);
  };

  for (const task of tasks) {
    visit(task.id);
  }

  return sorted;
};

/**
 * Generate weekly planning for a user
 *
 * @param input - userId and weekStartDate
 * @returns Generated time blocks, hours summary, and rescue slot count
 */
export const GenerateWeeklyPlanning = async (
  input: GenerateWeeklyPlanningInput,
): Promise<GenerateWeeklyPlanningOutput> => {
  const { userId, weekStartDate } = input;

  // Ensure weekStartDate is a Monday
  const monday = startOfWeek(weekStartDate, { weekStartsOn: 1 });

  // Fetch plannable tasks (sacred + important, not already planned)
  // Tasks are "already planned" if they have time blocks in this week
  const weekEndDate = addDays(monday, 7);

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      deletedAt: null,
      archivedAt: null,
      status: "todo",
      kanbanColumn: "todo",
      priority: {
        in: ["sacred", "important"],
      },
      // Exclude tasks that already have time blocks this week
      NOT: {
        timeBlocks: {
          some: {
            date: {
              gte: monday,
              lt: weekEndDate,
            },
          },
        },
      },
    },
    orderBy: [
      { priority: "desc" },
      { difficulty: "desc" },
      { deadline: { sort: "asc", nulls: "last" } },
    ],
  });

  // Map Prisma tasks to TaskForPlanning format with dependencies
  const tasksWithDeps: TaskWithDeps[] = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    difficulty: task.difficulty,
    estimatedDuration: task.estimatedDuration,
    priority: task.priority as "sacred" | "important" | "optional",
    dependencies: task.dependencies,
  }));

  // Sort tasks to respect dependencies (task B after task A if B depends on A)
  const tasksForPlanning: TaskForPlanning[] = sortByDependencies(tasksWithDeps);

  // Get user chronotype (default to "bear" until preferences are implemented)
  const chronotype = DEFAULT_CHRONOTYPE;
  const peakHours = getPeakHours(chronotype);

  // Generate planning for each work day (Mon-Fri)
  const allTimeBlocks: TimeBlock[] = [];
  const workDays = 5;

  for (let dayIndex = 0; dayIndex < workDays; dayIndex++) {
    const currentDay = addDays(monday, dayIndex);

    // Distribute tasks across days (simple approach: give each day equal share)
    const tasksPerDay = Math.ceil(
      tasksForPlanning.length / (workDays - dayIndex),
    );
    const dayTasks = tasksForPlanning.splice(0, tasksPerDay);

    if (dayTasks.length === 0) {
      continue; // Skip day if no tasks
    }

    const dayBlocks = planDay({
      day: currentDay,
      workHours: DEFAULT_WORK_HOURS,
      peakHours,
      tasks: dayTasks,
      bufferPercentage: DEFAULT_BUFFER_PERCENTAGE,
    });

    allTimeBlocks.push(...dayBlocks);
  }

  // Add rescue slots on Friday 16h-18h (2 hours = 2 slots of 1h each)
  const friday = addDays(monday, RESCUE_SLOT_DAY);
  // Use setHours/setMinutes for consistency with planDay date handling
  const rescueStart = setMinutes(setHours(friday, RESCUE_SLOT_START_HOUR), 0);
  const rescueEnd = setMinutes(setHours(friday, RESCUE_SLOT_END_HOUR), 0);

  allTimeBlocks.push({
    date: friday,
    startTime: rescueStart,
    endTime: rescueEnd,
    blockType: "rescue",
  });

  // Calculate totals
  const totalMinutes = allTimeBlocks.reduce((acc, block) => {
    if (block.blockType === "buffer" || block.blockType === "rescue") {
      return acc;
    }
    const duration =
      (block.endTime.getTime() - block.startTime.getTime()) / (1000 * 60);
    return acc + duration;
  }, 0);

  const bufferMinutes = allTimeBlocks
    .filter((block) => block.blockType === "buffer")
    .reduce((acc, block) => {
      const duration =
        (block.endTime.getTime() - block.startTime.getTime()) / (1000 * 60);
      return acc + duration;
    }, 0);

  const rescueSlots = allTimeBlocks.filter(
    (block) => block.blockType === "rescue",
  ).length;

  return {
    timeBlocks: allTimeBlocks,
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    bufferHours: Math.round((bufferMinutes / 60) * 10) / 10,
    rescueSlots,
  };
};
