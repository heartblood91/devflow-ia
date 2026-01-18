"use server";

/**
 * Server Action for fetching weekly statistics
 *
 * Retrieves calculated stats for a given week using calculateWeeklyStats.
 */

import { authAction } from "@/lib/actions/safe-actions";
import { GetWeeklyStatsSchema } from "./getWeeklyStats.schema";
import { calculateWeeklyStats } from "@/lib/stats/calculateWeeklyStats";
import { startOfWeek } from "date-fns";

export const getWeeklyStatsAction = authAction
  .inputSchema(GetWeeklyStatsSchema)
  .action(async ({ parsedInput: { weekStart }, ctx: { user } }) => {
    const weekStartDate = new Date(weekStart);
    const weekBegin = startOfWeek(weekStartDate, { weekStartsOn: 1 });

    return calculateWeeklyStats(user.id, weekBegin);
  });
