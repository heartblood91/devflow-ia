"use client";

import { getDateFnsLocale } from "@/lib/format/date";
import type { WeeklyTimeBlocks } from "@/lib/actions/getWeeklyTimeBlocks.action";
import { addDays, format, startOfWeek } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import { DayColumn } from "./DayColumn";
import { cn } from "@/lib/utils";

type WeeklyGridProps = {
  currentWeek: Date;
  timeBlocks?: WeeklyTimeBlocks | null;
};

const WORK_HOURS = {
  start: 8,
  end: 19,
};

const PRODUCTIVE_HOURS = {
  start: 9,
  end: 18,
};

const isProductiveHour = (hour: number): boolean => {
  return hour >= PRODUCTIVE_HOURS.start && hour < PRODUCTIVE_HOURS.end;
};

const isWeekendDay = (dayIndex: number): boolean => {
  return dayIndex >= 5;
};

const DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export const WeeklyGrid = ({ currentWeek, timeBlocks }: WeeklyGridProps) => {
  const t = useTranslations("weekly");
  const locale = useLocale();
  const dateFnsLocale = getDateFnsLocale(locale);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });

  const timeSlots = Array.from(
    { length: WORK_HOURS.end - WORK_HOURS.start + 1 },
    (_, i) => WORK_HOURS.start + i,
  );

  const weekDays = DAY_KEYS.map((_, index) => addDays(weekStart, index));

  const formatTime = (hour: number) => {
    return `${hour.toString().padStart(2, "0")}:00`;
  };

  return (
    <div className="border-border bg-card overflow-x-auto rounded-lg border-2">
      {/* Grid container */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: "80px repeat(7, minmax(120px, 1fr))",
        }}
      >
        {/* Header row */}
        <div className="border-border bg-muted/50 sticky left-0 z-10 border-r-2 border-b-2 p-3" />
        {weekDays.map((day, index) => (
          <div
            key={DAY_KEYS[index]}
            className="border-border bg-muted/50 border-r-2 border-b-2 p-3 text-center last:border-r-0"
          >
            <span className="text-sm font-bold tracking-wider uppercase">
              {t(`days.${DAY_KEYS[index]}`)}
            </span>
            <span className="text-muted-foreground ml-2 text-sm">
              {format(day, "d", { locale: dateFnsLocale })}
            </span>
          </div>
        ))}

        {/* Time column with time slots */}
        <div className="border-border sticky left-0 z-10 border-r-2">
          {timeSlots.map((hour) => (
            <div
              key={`time-${hour}`}
              className="border-border bg-muted/30 flex h-16 items-start justify-end border-b pt-1 pr-3"
            >
              <span className="text-muted-foreground text-xs font-medium">
                {formatTime(hour)}
              </span>
            </div>
          ))}
        </div>

        {/* Day columns with time blocks */}
        {DAY_KEYS.map((dayKey, dayIndex) => {
          const isWeekend = isWeekendDay(dayIndex);

          return (
            <div
              key={dayKey}
              className="border-border relative border-r last:border-r-0"
            >
              {/* Background cells for grid lines with work hours styling */}
              {timeSlots.map((hour) => {
                const isProductive = isProductiveHour(hour);
                // Strong visual distinction: productive hours have more prominent background
                const cellClasses = isWeekend
                  ? "bg-muted/10 dark:bg-muted/5"
                  : isProductive
                    ? "bg-primary/10 hover:bg-primary/15 dark:bg-primary/20 dark:hover:bg-primary/25"
                    : "bg-muted/5 hover:bg-muted/10 dark:bg-muted/5 dark:hover:bg-muted/10";

                return (
                  <div
                    key={`${dayKey}-${hour}`}
                    className={cn(
                      "border-border h-16 border-b transition-colors",
                      cellClasses,
                    )}
                  />
                );
              })}

              {/* Weekend OFF zone overlay */}
              {isWeekend && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="text-muted-foreground/30 text-4xl font-bold tracking-widest">
                    {t("offDay")}
                  </span>
                </div>
              )}

              {/* Overlay DayColumn with time blocks */}
              <div className="absolute inset-0">
                <DayColumn
                  day={weekDays[dayIndex]}
                  timeBlocks={timeBlocks?.[dayKey] ?? []}
                  workHours={WORK_HOURS}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
