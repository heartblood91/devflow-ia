"use server";

/**
 * Server Action for fetching plannable backlog tasks
 *
 * Returns tasks that are eligible for weekly planning:
 * - Status: todo
 * - KanbanColumn: todo
 * - Priority: sacred or important (optional tasks excluded)
 * - Not soft-deleted
 * - Ordered by priority DESC, difficulty DESC, deadline ASC
 */

import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import type { Task } from "@/generated/prisma";

/**
 * Get backlog tasks eligible for War Room planning
 *
 * Returns sacred and important tasks that are in the todo column.
 * Optional tasks are excluded as they are not plannable.
 * Tasks are ordered to show highest priority, hardest, and earliest deadline first.
 */
export const getBacklogTasksAction = authAction.action(
  async ({ ctx: { user } }): Promise<{ tasks: Task[] }> => {
    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        status: "todo",
        kanbanColumn: "todo",
        priority: {
          in: ["sacred", "important"],
        },
        deletedAt: null,
      },
      orderBy: [
        { priority: "desc" }, // sacred > important
        { difficulty: "desc" }, // harder first
        { deadline: { sort: "asc", nulls: "last" } }, // earliest deadline first, no deadline at end
      ],
    });

    return { tasks };
  },
);
