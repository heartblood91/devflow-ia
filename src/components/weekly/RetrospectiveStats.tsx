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
import {
  getWeeklyStatsAction,
  type WeeklyStats,
} from "@/lib/actions/getWeeklyStats.action";
import { resolveActionResult } from "@/lib/actions/actions-utils";

type RetrospectiveStatsProps = {
  weekStartDate: Date;
};

/**
 * Display weekly statistics in a responsive grid of StatCards.
 * Used in the War Room modal for retrospective analysis.
 */
export const RetrospectiveStats = ({
  weekStartDate,
}: RetrospectiveStatsProps) => {
  const t = useTranslations("weekly.stats");
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [_isPending, startTransition] = useTransition();

  useEffect(() => {
    let mounted = true;

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

  return (
    <div className="flex flex-col gap-4">
      <Card className="rounded-none border-2">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Tasks Completed */}
            <StatCard
              icon={CheckCircle}
              label={t("tasksCompleted")}
              value={
                stats ? `${stats.completedTasks}/${stats.totalTasks}` : "-"
              }
              percentage={stats ? getTasksCompletedPercentage() : undefined}
              variant="success"
            />

            {/* Total Hours */}
            <StatCard
              icon={Clock}
              label={t("totalHours")}
              value={stats ? `${stats.totalHours}h` : "-"}
              percentage={stats ? getHoursPercentage() : undefined}
              variant="info"
            />

            {/* Rescue Slots */}
            <StatCard
              icon={Flame}
              label={t("rescueSlots")}
              value={stats ? `${stats.rescueUsed}/${stats.rescueMax}` : "-"}
              percentage={stats ? getRescuePercentage() : undefined}
              variant="warning"
            />

            {/* Skipped Tasks */}
            <StatCard
              icon={AlertCircle}
              label={t("skippedTasks")}
              value={stats?.skippedTasks ?? "-"}
              variant="error"
            />

            {/* Focus Quality */}
            <StatCard
              icon={Target}
              label={t("focusQuality")}
              value={stats?.avgFocusQuality ?? "-"}
              variant="info"
            />

            {/* Energy Level */}
            <StatCard
              icon={Battery}
              label={t("energyLevel")}
              value={stats?.avgEnergyLevel ?? "-"}
              variant="info"
            />
          </div>
        </CardContent>
      </Card>

      <DevFlowAIInsights stats={stats} />
    </div>
  );
};
