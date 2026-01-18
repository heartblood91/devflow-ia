import { z } from "zod";

export const GetWeeklyStatsSchema = z.object({
  weekStart: z.string().datetime(),
});

export type GetWeeklyStatsSchemaType = z.infer<typeof GetWeeklyStatsSchema>;
