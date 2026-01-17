import { verifyCronAuth } from "@/lib/cron-auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Auto-archive tasks that have been completed for 7+ days
 *
 * This cron job should be called daily (e.g., via Vercel Cron, GitHub Actions, or external cron service)
 *
 * Security: Protected by CRON_SECRET environment variable
 *
 * @example Vercel cron configuration in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/auto-archive",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 */
export const GET = async (req: NextRequest) => {
  const auth = verifyCronAuth(req, "auto-archive");
  if (!auth.authorized) return auth.response;

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Find and archive completed tasks older than 7 days
    const result = await prisma.task.updateMany({
      where: {
        status: "done",
        completedAt: {
          lte: sevenDaysAgo,
        },
        archivedAt: null, // Not already archived
        deletedAt: null, // Not soft-deleted
      },
      data: {
        archivedAt: new Date(),
      },
    });

    logger.info(`Auto-archived ${result.count} tasks`);

    return NextResponse.json({
      success: true,
      archivedCount: result.count,
      message: `Successfully archived ${result.count} tasks`,
    });
  } catch (error) {
    logger.error("Auto-archive cron job failed", error);
    return NextResponse.json({ error: "Auto-archive failed" }, { status: 500 });
  }
};
