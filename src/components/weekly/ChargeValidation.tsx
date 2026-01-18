"use client";

import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

type ChargeValidationProps = {
  totalHours: number;
  maxHours?: number;
};

/**
 * Validates weekly workload against maximum capacity.
 * Displays a progress bar with current/max hours.
 * Shows warning when workload exceeds capacity.
 */
export const ChargeValidation = ({
  totalHours,
  maxHours = 20,
}: ChargeValidationProps) => {
  const t = useTranslations("weekly.warRoomModal.chargeValidation");

  const safeMaxHours = Math.max(1, maxHours);
  const isOverloaded = totalHours > safeMaxHours;
  const percentage = Math.min(100, (totalHours / safeMaxHours) * 100);
  const excessHours = Math.round((totalHours - safeMaxHours) * 10) / 10;

  return (
    <div
      data-testid="charge-validation"
      className={cn(
        "flex flex-col gap-2 rounded-none border-2 bg-white p-3 dark:bg-gray-950",
        isOverloaded ? "border-red-500" : "border-green-500",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
          {t("workload")}
        </span>
        <span
          className={cn(
            "text-sm font-bold",
            isOverloaded ? "text-red-500" : "text-green-500",
          )}
        >
          {totalHours}h/{safeMaxHours}h
        </span>
      </div>

      <div
        className="h-3 w-full overflow-hidden rounded-none bg-gray-200 dark:bg-gray-700"
        role="progressbar"
        aria-valuenow={totalHours}
        aria-valuemin={0}
        aria-valuemax={safeMaxHours}
        aria-label={t("ariaLabel", { current: totalHours, max: safeMaxHours })}
      >
        <div
          className={cn(
            "h-full transition-all duration-300",
            isOverloaded ? "bg-red-500" : "bg-green-500",
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {isOverloaded && (
        <div className="flex items-center gap-2 text-red-500">
          <AlertTriangle className="size-4" aria-hidden="true" />
          <span className="text-xs font-bold">
            {t("overloaded", { hours: excessHours })}
          </span>
        </div>
      )}
    </div>
  );
};
