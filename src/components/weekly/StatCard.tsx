import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardVariant = "success" | "info" | "warning" | "error" | "muted";

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string | number;
  percentage?: number;
  variant: StatCardVariant;
  showProgressBar?: boolean;
};

const VARIANT_STYLES: Record<StatCardVariant, string> = {
  success: "border-green-500",
  info: "border-blue-500",
  warning: "border-yellow-500",
  error: "border-red-500",
  muted: "border-gray-300",
};

const PROGRESS_BAR_STYLES: Record<StatCardVariant, string> = {
  success: "bg-green-500",
  info: "bg-blue-500",
  warning: "bg-yellow-500",
  error: "bg-red-500",
  muted: "bg-gray-300",
};

/**
 * Brutal design stat card for displaying metrics.
 * Features thick borders, uppercase labels, progress bars and hover states.
 */
export const StatCard = ({
  icon: Icon,
  label,
  value,
  percentage,
  variant,
  showProgressBar = true,
}: StatCardProps) => {
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 rounded-none border-2 bg-white p-3 transition-all hover:border-4 dark:bg-gray-950",
        VARIANT_STYLES[variant],
      )}
    >
      <div className="flex items-center justify-between">
        <Icon className="size-6" aria-hidden="true" />
        {percentage !== undefined && (
          <span className="text-muted-foreground text-sm font-bold">
            {percentage}%
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xl font-bold sm:text-2xl">{value}</span>
        <span className="text-muted-foreground text-[10px] leading-tight tracking-wide uppercase sm:text-xs">
          {label}
        </span>
      </div>
      {showProgressBar && percentage !== undefined && (
        <div
          className="h-2 w-full overflow-hidden rounded-none bg-gray-200 dark:bg-gray-700"
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${percentage}%`}
        >
          <div
            className={cn(
              "h-full transition-all duration-300",
              PROGRESS_BAR_STYLES[variant],
            )}
            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
          />
        </div>
      )}
    </div>
  );
};
