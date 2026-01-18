"use client";

import { useState, useEffect, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  CheckCircle,
  Clock,
  Flame,
  AlertCircle,
  Target,
  Battery,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatCard } from "./StatCard";
import { DevFlowAIInsights } from "./DevFlowAIInsights";
import { getWeeklyStatsAction } from "@/lib/actions/getWeeklyStats.action";
import type { WeeklyStats } from "@/lib/stats/calculateWeeklyStats";
import { resolveActionResult } from "@/lib/actions/actions-utils";

type RetrospectiveStatsProps = {
  weekStartDate: Date;
};

const StatCardSkeleton = () => (
  <div className="flex animate-pulse flex-col gap-2 rounded-none border-2 border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-950">
    <div className="flex items-center justify-between">
      <div className="size-6 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-4 w-10 rounded bg-gray-200 dark:bg-gray-700" />
    </div>
    <div className="flex flex-col gap-1">
      <div className="h-7 w-16 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />
    </div>
    <div className="h-2 w-full rounded bg-gray-200 dark:bg-gray-700" />
  </div>
);

/**
 * Display weekly statistics in a responsive grid of StatCards.
 * Used in the War Room modal for retrospective analysis.
 */
export const RetrospectiveStats = ({
  weekStartDate,
}: RetrospectiveStatsProps) => {
  const t = useTranslations("weekly.stats");
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [_isPending, startTransition] = useTransition();

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    const fetchStats = async () => {
      try {
        const result = await resolveActionResult(
          getWeeklyStatsAction({ weekStart: weekStartDate.toISOString() }),
        );
        if (mounted) {
          setStats(result);
        }
      } catch {
        if (mounted) {
          setStats(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    startTransition(() => {
      void fetchStats();
    });

    return () => {
      mounted = false;
    };
  }, [weekStartDate]);

  const getTasksCompletedPercentage = () => {
    if (!stats || stats.totalTasks === 0) return 0;
    return Math.round((stats.completedTasks / stats.totalTasks) * 100);
  };

  const getHoursPercentage = () => {
    if (!stats) return 0;
    return Math.round((stats.totalHours / stats.maxHours) * 100);
  };

  const getRescuePercentage = () => {
    if (!stats) return 0;
    return Math.round((stats.rescueUsed / stats.rescueMax) * 100);
  };

  // Focus and Energy are not yet implemented (DailyReflection model pending)
  const isFocusAvailable = stats && stats.avgFocusQuality > 0;
  const isEnergyAvailable = stats && stats.avgEnergyLevel > 0;

  return (
    <div className="flex flex-col gap-4">
      <Card className="rounded-none border-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {isLoading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                {/* Tasks Completed */}
                <StatCard
                  icon={CheckCircle}
                  label={t("tasksCompleted")}
                  value={
                    stats
                      ? `${stats.completedTasks}/${stats.totalTasks}`
                      : "0/0"
                  }
                  percentage={getTasksCompletedPercentage()}
                  variant="success"
                />

                {/* Total Hours */}
                <StatCard
                  icon={Clock}
                  label={t("totalHours")}
                  value={stats ? `${stats.totalHours}h` : "0h"}
                  percentage={getHoursPercentage()}
                  variant="info"
                />

                {/* Rescue Slots */}
                <StatCard
                  icon={Flame}
                  label={t("rescueSlots")}
                  value={
                    stats ? `${stats.rescueUsed}/${stats.rescueMax}` : "0/2"
                  }
                  percentage={getRescuePercentage()}
                  variant="warning"
                />

                {/* Skipped Tasks */}
                <StatCard
                  icon={AlertCircle}
                  label={t("skippedTasks")}
                  value={stats?.skippedTasks ?? 0}
                  variant="error"
                  showProgressBar={false}
                />

                {/* Focus Quality - muted if not available */}
                <StatCard
                  icon={Target}
                  label={t("focusQuality")}
                  value={
                    isFocusAvailable ? stats.avgFocusQuality : t("comingSoon")
                  }
                  variant={isFocusAvailable ? "info" : "muted"}
                  showProgressBar={false}
                />

                {/* Energy Level - muted if not available */}
                <StatCard
                  icon={Battery}
                  label={t("energyLevel")}
                  value={
                    isEnergyAvailable ? stats.avgEnergyLevel : t("comingSoon")
                  }
                  variant={isEnergyAvailable ? "info" : "muted"}
                  showProgressBar={false}
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <DevFlowAIInsights stats={stats} />
    </div>
  );
};
