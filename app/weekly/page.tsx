import { Typography } from "@/components/nowts/typography";
import { WeeklyHeader } from "@/components/weekly/WeeklyHeader";
import { getRequiredCurrentUser } from "@/lib/user/get-user";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "Weekly Planning | DevFlow",
  description: "Plan your week with time-blocking for maximum productivity",
};

export default async function WeeklyPage() {
  await getRequiredCurrentUser();
  const t = await getTranslations("weekly");

  return (
    <div className="container mx-auto flex min-h-screen flex-col px-4 py-8">
      {/* Header Section */}
      <header className="mb-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Typography variant="h1" className="mb-2">
              {t("pageTitle")}
            </Typography>
            <Typography variant="muted" className="text-lg">
              {t("pageDescription")}
            </Typography>
          </div>
          <WeeklyHeader currentWeek={new Date()} />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 gap-6">
        {/* Grid Area - Weekly Calendar */}
        <main className="flex-1">
          <div className="border-border bg-card min-h-[600px] rounded-lg border-2 p-4">
            {/* Placeholder for WeeklyGrid component */}
            <div className="text-muted-foreground flex h-full items-center justify-center">
              {t("gridPlaceholder")}
            </div>
          </div>
        </main>

        {/* Sidebar Area (Optional) */}
        <aside className="hidden w-80 lg:block">
          <div className="border-border bg-card min-h-[400px] rounded-lg border-2 p-4">
            {/* Placeholder for sidebar content */}
            <div className="text-muted-foreground flex h-full items-center justify-center">
              {t("sidebarPlaceholder")}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
