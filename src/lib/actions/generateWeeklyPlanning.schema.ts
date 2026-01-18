import { z } from "zod";

/**
 * Schema for generateWeeklyPlanning action
 * Input: weekStartDate - the Monday of the week to plan
 */
export const GenerateWeeklyPlanningSchema = z.object({
  weekStartDate: z.coerce.date(),
});
