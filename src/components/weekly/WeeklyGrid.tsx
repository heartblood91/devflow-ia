"use client";

import { addDays, format, startOfWeek } from "date-fns";
import { enUS, fr } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import type { WeeklyTimeBlocks } from "@/lib/actions/getWeeklyTimeBlocks.action";
import { DayColumn } from "./DayColumn";

type WeeklyGridProps = {
  currentWeek: Date;
  timeBlocks?: WeeklyTimeBlocks | null;
};

const LOCALE_MAP = {
  en: enUS,
  fr: fr,
} as const;

const WORK_HOURS = {
  start: 8,
  end: 19,
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
  const dateFnsLocale =
    locale in LOCALE_MAP ? LOCALE_MAP[locale as keyof typeof LOCALE_MAP] : enUS;

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
    <div className="border-border bg-card overflow-hidden rounded-lg border-2">
      {/* Grid container */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: "80px repeat(7, 1fr)",
        }}
      >
        {/* Header row */}
        <div className="border-border bg-muted/50 border-r-2 border-b-2 p-3" />
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
        <div className="border-border border-r-2">
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
        {DAY_KEYS.map((dayKey, index) => (
          <div
            key={dayKey}
            className="border-border relative border-r last:border-r-0"
          >
            {/* Background cells for grid lines */}
            {timeSlots.map((hour) => (
              <div
                key={`${dayKey}-${hour}`}
                className="border-border hover:bg-muted/20 h-16 border-b transition-colors"
              />
            ))}

            {/* Overlay DayColumn with time blocks */}
            <div className="absolute inset-0">
              <DayColumn
                day={weekDays[index]}
                timeBlocks={timeBlocks?.[dayKey] ?? []}
                workHours={WORK_HOURS}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
