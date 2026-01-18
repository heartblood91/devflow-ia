import { z } from "zod";

export const GenerateWeeklyInsightsSchema = z.object({
  stats: z.object({
    completedTasks: z.number(),
    totalTasks: z.number(),
    skippedTasks: z.number(),
    totalHours: z.number(),
    maxHours: z.number(),
    rescueUsed: z.number(),
    rescueMax: z.number(),
    avgFocusQuality: z.number(),
    avgEnergyLevel: z.number(),
  }),
});

export type GenerateWeeklyInsightsSchemaType = z.infer<
  typeof GenerateWeeklyInsightsSchema
>;
