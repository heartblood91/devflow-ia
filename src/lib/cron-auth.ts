import { logger } from "@/lib/logger";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type CronAuthResult =
  | { authorized: true }
  | { authorized: false; response: NextResponse };

/**
 * Verify cron job authentication
 *
 * @description
 * Validates the Authorization header against CRON_SECRET environment variable.
 * All cron routes should call this function at the start to ensure security.
 *
 * @example
 * export const GET = async (req: NextRequest) => {
 *   const auth = verifyCronAuth(req, "my-cron-job");
 *   if (!auth.authorized) return auth.response;
 *
 *   // Proceed with cron logic...
 * };
 *
 * @param req - The incoming Next.js request
 * @param cronName - Name of the cron job for logging purposes
 * @returns Object with `authorized: true` or `authorized: false` with a 401 response
 */
export const verifyCronAuth = (
  req: NextRequest,
  cronName: string,
): CronAuthResult => {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    logger.warn(`Unauthorized cron request to ${cronName}`);
    return {
      authorized: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { authorized: true };
};
