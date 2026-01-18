"use server";

/**
 * Server Action for saving weekly planning to database
 *
 * Persists the generated/modified time blocks to the TimeBlock table.
 * Called when user clicks "Confirm" in the War Room modal.
 *
 * Note: The kanbanColumn update to "planned" was specified in PRD but
 * "planned" is not a valid KanbanColumn enum value. Tasks are implicitly
 * planned when they have associated timeBlocks.
 */

import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import {
  SaveWeeklyPlanningSchema,
  type TimeBlockInput,
} from "./saveWeeklyPlanning.schema";
import type { BlockType } from "@/generated/prisma";

/**
 * Save weekly planning time blocks to database
 *
 * @param timeBlocks - Array of time blocks to save
 * @returns Success boolean
 */
export const saveWeeklyPlanningAction = authAction
  .inputSchema(SaveWeeklyPlanningSchema)
  .action(async ({ parsedInput: { timeBlocks }, ctx: { user } }) => {
    // Filter out blocks without valid data
    const validBlocks = timeBlocks.filter(
      (block): block is TimeBlockInput & { date: Date } =>
        block.date instanceof Date && !Number.isNaN(block.date.getTime()),
    );

    if (validBlocks.length === 0) {
      return { success: true };
    }

    // Prepare data for createMany - include userId for each block
    const createData = validBlocks.map((block) => ({
      userId: user.id,
      date: block.date,
      startTime: block.startTime,
      endTime: block.endTime,
      blockType: block.blockType as BlockType,
      taskId: block.taskId ?? null,
    }));

    // Save all time blocks in a single transaction
    await prisma.timeBlock.createMany({
      data: createData,
    });

    return { success: true };
  });
