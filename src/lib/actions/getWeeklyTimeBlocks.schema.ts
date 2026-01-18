import { z } from "zod";

export const GetWeeklyTimeBlocksSchema = z.object({
  weekStart: z.string().datetime(),
});

export type GetWeeklyTimeBlocksSchemaType = z.infer<
  typeof GetWeeklyTimeBlocksSchema
>;
