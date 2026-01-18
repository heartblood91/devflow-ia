import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardVariant = "success" | "info" | "warning" | "error";

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string | number;
  percentage?: number;
  variant: StatCardVariant;
};

const VARIANT_STYLES: Record<StatCardVariant, string> = {
  success: "border-green-500",
  info: "border-blue-500",
  warning: "border-yellow-500",
  error: "border-red-500",
};

/**
 * Brutal design stat card for displaying metrics.
 * Features thick borders, uppercase labels, and hover states.
 */
export const StatCard = ({
  icon: Icon,
  label,
  value,
  percentage,
  variant,
}: StatCardProps) => {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-none border-2 bg-white p-4 transition-all hover:border-4 dark:bg-gray-950",
        VARIANT_STYLES[variant],
      )}
    >
      <div className="flex items-center justify-between">
        <Icon className="size-8" aria-hidden="true" />
        {percentage !== undefined && (
          <span className="text-muted-foreground text-sm font-medium">
            {percentage}%
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-3xl font-bold">{value}</span>
        <span className="text-muted-foreground text-sm uppercase">{label}</span>
      </div>
    </div>
  );
};
