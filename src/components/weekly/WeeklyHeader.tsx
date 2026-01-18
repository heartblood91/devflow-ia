"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getDateFnsLocale } from "@/lib/format/date";
import { addWeeks, endOfWeek, format, startOfWeek, subWeeks } from "date-fns";
import { ChevronLeft, ChevronRight, Target } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { WarRoomModal } from "./WarRoomModal";

type WeeklyHeaderProps = {
  currentWeek: Date;
  onWeekChange?: (newWeek: Date) => void;
};

export const WeeklyHeader = ({
  currentWeek,
  onWeekChange,
}: WeeklyHeaderProps) => {
  const [isWarRoomOpen, setIsWarRoomOpen] = useState(false);
  const t = useTranslations("weekly");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const dateFnsLocale = getDateFnsLocale(locale);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

  const formatWeekRange = () => {
    const startMonth = format(weekStart, "MMMM d", { locale: dateFnsLocale });
    const endDay = format(weekEnd, "d", { locale: dateFnsLocale });
    const year = format(weekEnd, "yyyy", { locale: dateFnsLocale });

    const isSameMonth = weekStart.getMonth() === weekEnd.getMonth();

    if (isSameMonth) {
      return `${startMonth} - ${endDay}, ${year}`;
    }

    const endMonth = format(weekEnd, "MMMM d", { locale: dateFnsLocale });
    return `${startMonth} - ${endMonth}, ${year}`;
  };

  const handlePreviousWeek = () => {
    onWeekChange?.(subWeeks(currentWeek, 1));
  };

  const handleNextWeek = () => {
    onWeekChange?.(addWeeks(currentWeek, 1));
  };

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Week navigation and title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousWeek}
            aria-label={tCommon("previous")}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextWeek}
            aria-label={tCommon("next")}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="flex flex-col gap-0.5">
          <h2 className="text-2xl font-bold tracking-tight">{t("weekOf")}</h2>
          <p className="text-muted-foreground text-lg">{formatWeekRange()}</p>
        </div>
      </div>

      {/* War Room button */}
      <Button
        variant="default"
        className="gap-2"
        onClick={() => setIsWarRoomOpen(true)}
      >
        <Target className="size-4" />
        {t("warRoom")}
      </Button>

      <WarRoomModal
        open={isWarRoomOpen}
        onOpenChange={setIsWarRoomOpen}
        weekStartDate={weekStart}
      />
    </div>
  );
};
