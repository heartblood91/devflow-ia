"use server";

/**
 * Server Action for generating weekly planning
 *
 * Generates a preview of the weekly time blocks based on:
 * - User's backlog tasks (sacred + important)
 * - Chronotype-based peak hours scheduling
 * - Buffer time allocation
 * - Rescue slots on Friday afternoon
 *
 * Returns time blocks for preview - does NOT save to database.
 * Use saveWeeklyPlanning action to persist after user confirmation.
 */

import { authAction } from "@/lib/actions/safe-actions";
import { GenerateWeeklyPlanning } from "@/lib/usecases/GenerateWeeklyPlanning";
import { GenerateWeeklyPlanningSchema } from "./generateWeeklyPlanning.schema";

/**
 * Generate weekly planning time blocks for preview
 *
 * @param weekStartDate - Monday of the week to plan
 * @returns Time blocks array, total hours, buffer hours, and rescue slot count
 */
export const generateWeeklyPlanningAction = authAction
  .inputSchema(GenerateWeeklyPlanningSchema)
  .action(async ({ parsedInput: { weekStartDate }, ctx: { user } }) => {
    const result = await GenerateWeeklyPlanning({
      userId: user.id,
      weekStartDate,
    });

    return result;
  });
