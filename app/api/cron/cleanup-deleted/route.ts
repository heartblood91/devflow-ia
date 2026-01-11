import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Permanently delete soft-deleted tasks after 30 days
 *
 * This cron job should be called daily (e.g., via Vercel Cron, GitHub Actions, or external cron service)
 *
 * Security: Protected by CRON_SECRET environment variable
 *
 * @example Vercel cron configuration in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup-deleted",
 *     "schedule": "0 1 * * *"
 *   }]
 * }
 */
export const GET = async (req: NextRequest) => {
  // Verify cron secret for security
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    logger.warn("Unauthorized cron request to cleanup-deleted");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Permanently delete soft-deleted tasks older than 30 days
    const result = await prisma.task.deleteMany({
      where: {
        deletedAt: {
          lte: thirtyDaysAgo,
        },
      },
    });

    logger.info(`Permanently deleted ${result.count} soft-deleted tasks`);

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `Successfully deleted ${result.count} tasks`,
    });
  } catch (error) {
    logger.error("Cleanup deleted cron job failed", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
};
