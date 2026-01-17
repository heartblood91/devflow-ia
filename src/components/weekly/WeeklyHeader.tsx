"use client";

import { endOfWeek, format, startOfWeek } from "date-fns";
import { enUS, fr } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";

type WeeklyHeaderProps = {
  currentWeek: Date;
};

const LOCALE_MAP = {
  en: enUS,
  fr: fr,
} as const;

export const WeeklyHeader = ({ currentWeek }: WeeklyHeaderProps) => {
  const t = useTranslations("weekly");
  const locale = useLocale();
  const dateFnsLocale =
    locale in LOCALE_MAP ? LOCALE_MAP[locale as keyof typeof LOCALE_MAP] : enUS;

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

  const formatWeekRange = () => {
    const startMonth = format(weekStart, "MMMM d", { locale: dateFnsLocale });
    const endDay = format(weekEnd, "d", { locale: dateFnsLocale });
    const year = format(weekEnd, "yyyy", { locale: dateFnsLocale });

    // Check if start and end are in the same month
    const isSameMonth = weekStart.getMonth() === weekEnd.getMonth();

    if (isSameMonth) {
      return `${startMonth} - ${endDay}, ${year}`;
    }

    const endMonth = format(weekEnd, "MMMM d", { locale: dateFnsLocale });
    return `${startMonth} - ${endMonth}, ${year}`;
  };

  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-2xl font-bold tracking-tight">{t("weekOf")}</h2>
      <p className="text-muted-foreground text-lg">{formatWeekRange()}</p>
    </div>
  );
};
