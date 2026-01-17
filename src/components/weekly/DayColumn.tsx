"use client";

import type { TimeBlockWithTask } from "@/lib/actions/getWeeklyTimeBlocks.action";
import { TimeBlockCard } from "./TimeBlockCard";

type WorkHours = {
  start: number;
  end: number;
};

type DayColumnProps = {
  day: Date;
  timeBlocks: TimeBlockWithTask[];
  workHours: WorkHours;
};

const HOUR_HEIGHT = 64; // h-16 = 64px per hour slot

/**
 * Calculate the top position offset for a time block based on its start time
 */
const calculateTopOffset = (
  startTime: Date,
  workHoursStart: number,
): number => {
  const hours = startTime.getHours();
  const minutes = startTime.getMinutes();
  const hoursFromStart = hours - workHoursStart + minutes / 60;
  return hoursFromStart * HOUR_HEIGHT;
};

/**
 * Calculate the height of a time block based on its duration
 */
const calculateBlockHeight = (startTime: Date, endTime: Date): number => {
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);
  return Math.max(durationHours * HOUR_HEIGHT, HOUR_HEIGHT / 2); // Minimum height of 32px
};

/**
 * DayColumn component for displaying time blocks in a single day.
 * Positions blocks vertically based on their start time offset from work hours start.
 */
export const DayColumn = ({ timeBlocks, workHours }: DayColumnProps) => {
  const totalHours = workHours.end - workHours.start + 1;
  const columnHeight = totalHours * HOUR_HEIGHT;

  return (
    <div className="relative" style={{ height: columnHeight }}>
      {timeBlocks.map((block) => {
        const startTime = new Date(block.startTime);
        const endTime = new Date(block.endTime);

        const topOffset = calculateTopOffset(startTime, workHours.start);
        const blockHeight = calculateBlockHeight(startTime, endTime);

        return (
          <div
            key={block.id}
            className="absolute right-0.5 left-0.5"
            style={{
              top: topOffset,
              height: blockHeight,
            }}
          >
            <TimeBlockCard timeBlock={block} />
          </div>
        );
      })}
    </div>
  );
};
