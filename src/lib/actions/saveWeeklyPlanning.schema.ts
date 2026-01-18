import { z } from "zod";

/**
 * Schema for individual time block input
 */
const TimeBlockInputSchema = z.object({
  date: z.coerce.date(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  blockType: z.enum(["sacred", "important", "optional", "buffer", "rescue"]),
  taskId: z.string().optional(),
  taskTitle: z.string().optional(),
});

/**
 * Schema for saveWeeklyPlanning action
 * Accepts an array of time blocks to persist to database
 */
export const SaveWeeklyPlanningSchema = z.object({
  timeBlocks: z.array(TimeBlockInputSchema),
});

export type TimeBlockInput = z.infer<typeof TimeBlockInputSchema>;
