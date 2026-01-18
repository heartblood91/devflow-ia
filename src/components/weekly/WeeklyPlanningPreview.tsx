"use client";

import { useTranslations, useLocale } from "next-intl";
import { addDays, format } from "date-fns";
import { getDateFnsLocale } from "@/lib/format/date";
import { DropZone } from "./DropZone";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const TIME_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
] as const;

export type DroppedTask = {
  taskId: string;
  taskTitle: string;
  day: string;
  startTime: string;
};

type WeeklyPlanningPreviewProps = {
  droppedTasks: DroppedTask[];
  weekStartDate: Date;
  onDropTask?: (taskId: string, day: string, time: string) => void;
};

/**
 * Weekly planning preview with drop zones for each time slot.
 * Displays 7 columns (Mon-Sun) with time slots from 08:00 to 19:00.
 * Uses @dnd-kit/core DropZone components for drag & drop functionality.
 */
export const WeeklyPlanningPreview = ({
  droppedTasks,
  weekStartDate,
  onDropTask: _onDropTask,
}: WeeklyPlanningPreviewProps) => {
  const t = useTranslations("weekly.days");
  const locale = useLocale();
  const dateFnsLocale = getDateFnsLocale(locale);

  const getTaskForSlot = (day: string, time: string): DroppedTask | undefined =>
    droppedTasks.find((task) => task.day === day && task.startTime === time);

  const getDayDate = (dayIndex: number): string => {
    const date = addDays(weekStartDate, dayIndex);
    return format(date, "d", { locale: dateFnsLocale });
  };

  return (
    <div
      data-testid="planning-preview"
      className="overflow-x-auto rounded-none border-2 border-gray-400 dark:border-gray-600"
    >
      <div className="min-w-[640px]">
        {/* Day headers */}
        <div className="grid grid-cols-[50px_repeat(7,80px)] border-b-2 border-gray-400 bg-gray-100 dark:border-gray-600 dark:bg-gray-800">
          {/* Time column header */}
          <div className="flex h-10 items-center justify-center border-r border-gray-300 dark:border-gray-600" />

          {/* Day columns */}
          {DAYS.map((day, index) => (
            <div
              key={day}
              data-testid={`day-column-${day}`}
              className="flex h-10 flex-col items-center justify-center border-r border-gray-300 last:border-r-0 dark:border-gray-600"
            >
              <span className="text-xs font-bold uppercase">{t(day)}</span>
              <span className="text-muted-foreground text-xs">
                {getDayDate(index)}
              </span>
            </div>
          ))}
        </div>

        {/* Time slots */}
        {TIME_SLOTS.map((time) => (
          <div
            key={time}
            className="grid grid-cols-[50px_repeat(7,80px)] border-b border-gray-200 last:border-b-0 dark:border-gray-700"
          >
            {/* Time label */}
            <div className="flex h-10 items-center justify-center border-r border-gray-200 bg-gray-50 text-xs font-medium dark:border-gray-700 dark:bg-gray-900">
              {time}
            </div>

            {/* Drop zones for each day */}
            {DAYS.map((day) => {
              const droppedTask = getTaskForSlot(day, time);
              return (
                <DropZone
                  key={`${day}-${time}`}
                  day={day}
                  time={time}
                  taskTitle={droppedTask?.taskTitle}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
