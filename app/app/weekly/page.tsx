import { Typography } from "@/components/nowts/typography";
import { WeeklyContent } from "@/components/weekly/WeeklyContent";
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
    <div className="container mx-auto flex max-w-full flex-col overflow-x-hidden px-4 py-8">
      {/* Page Title Section */}
      <header className="mb-6">
        <Typography variant="h1" className="mb-2">
          {t("pageTitle")}
        </Typography>
        <Typography variant="muted" className="text-lg">
          {t("pageDescription")}
        </Typography>
      </header>

      {/* Client component for interactive content */}
      <WeeklyContent />
    </div>
  );
}
