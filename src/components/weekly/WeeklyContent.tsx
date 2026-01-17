"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { WeeklyGrid } from "./WeeklyGrid";
import { WeeklyHeader } from "./WeeklyHeader";

export const WeeklyContent = () => {
  const t = useTranslations("weekly");
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());

  const handleWeekChange = (newWeek: Date) => {
    setCurrentWeek(newWeek);
  };

  return (
    <>
      {/* Header with week navigation */}
      <WeeklyHeader currentWeek={currentWeek} onWeekChange={handleWeekChange} />

      {/* Main Content Area */}
      <div className="mt-8 flex flex-1 gap-6">
        {/* Grid Area - Weekly Calendar */}
        <main className="flex-1 overflow-x-auto">
          <WeeklyGrid currentWeek={currentWeek} />
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
