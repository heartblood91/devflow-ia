"use client";

import { useState, useEffect, useTransition } from "react";
import { startOfWeek } from "date-fns";
import { useTranslations } from "next-intl";
import { WeeklyGrid } from "./WeeklyGrid";
import { WeeklyHeader } from "./WeeklyHeader";
import {
  getWeeklyTimeBlocksAction,
  type WeeklyTimeBlocks,
} from "@/lib/actions/getWeeklyTimeBlocks.action";
import { resolveActionResult } from "@/lib/actions/actions-utils";

export const WeeklyContent = () => {
  const t = useTranslations("weekly");
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [timeBlocks, setTimeBlocks] = useState<WeeklyTimeBlocks | null>(null);
  const [_isPending, startTransition] = useTransition();

  const handleWeekChange = (newWeek: Date) => {
    setCurrentWeek(newWeek);
  };

  // Fetch time blocks when currentWeek changes
  useEffect(() => {
    let mounted = true;

    const fetchTimeBlocks = async () => {
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
      try {
        const result = await resolveActionResult(
          getWeeklyTimeBlocksAction({ weekStart: weekStart.toISOString() }),
        );
        if (mounted) {
          setTimeBlocks(result);
        }
      } catch {
        if (mounted) {
          // Show empty grid on error
          setTimeBlocks(null);
        }
      }
    };

    startTransition(() => {
      void fetchTimeBlocks();
    });

    return () => {
      mounted = false;
    };
  }, [currentWeek]);

  return (
    <>
      {/* Header with week navigation */}
      <WeeklyHeader currentWeek={currentWeek} onWeekChange={handleWeekChange} />

      {/* Main Content Area */}
      <div className="mt-8 flex flex-1 gap-6">
        {/* Grid Area - Weekly Calendar */}
        <main className="flex-1 overflow-x-auto">
          <WeeklyGrid currentWeek={currentWeek} timeBlocks={timeBlocks} />
        </main>

        {/* Sidebar Area (Optional) */}
        <aside className="hidden w-80 lg:block">
          <div className="border-border bg-card min-h-[400px] rounded-lg border-2 p-4">
            <div className="text-muted-foreground flex h-full items-center justify-center">
              {t("sidebarPlaceholder")}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
};
