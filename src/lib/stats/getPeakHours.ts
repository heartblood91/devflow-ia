/**
 * Get Peak Hours by Chronotype
 *
 * Returns optimal deep work hours based on the user's chronotype.
 * These are the biological peak performance windows when complex/difficult
 * tasks should be scheduled.
 *
 * Chronotypes:
 * - Bear (55% of population): Morning focus, afternoon second wind
 * - Lion (15%): Early morning peak, early afternoon recovery
 * - Wolf (15%): Late afternoon/evening peak performer
 * - Dolphin (10%): Light sleepers, limited peak windows
 */

export type Chronotype = "bear" | "lion" | "wolf" | "dolphin";

export type PeakHour = {
  start: string;
  end: string;
};

const PEAK_HOURS: Record<Chronotype, PeakHour[]> = {
  bear: [
    { start: "10:00", end: "12:00" },
    { start: "16:00", end: "18:00" },
  ],
  lion: [
    { start: "08:00", end: "10:00" },
    { start: "14:00", end: "16:00" },
  ],
  wolf: [
    { start: "16:00", end: "18:00" },
    { start: "20:00", end: "22:00" },
  ],
  dolphin: [{ start: "10:00", end: "12:00" }],
};

/**
 * Get peak hours for a given chronotype
 *
 * @param chronotype - The user's chronotype (bear, lion, wolf, dolphin)
 * @returns Array of peak hour windows with start and end times
 */
export const getPeakHours = (chronotype: string): PeakHour[] => {
  if (!chronotype) {
    return PEAK_HOURS.bear;
  }

  const normalizedChronotype = chronotype.toLowerCase() as Chronotype;

  if (normalizedChronotype in PEAK_HOURS) {
    return PEAK_HOURS[normalizedChronotype];
  }

  // Default to bear chronotype if unknown
  return PEAK_HOURS.bear;
};
