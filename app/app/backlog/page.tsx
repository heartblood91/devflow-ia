import { BacklogClient } from "@/components/backlog/backlog-client";
import { Typography } from "@/components/nowts/typography";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { getTasksAction } from "@/lib/actions/tasks.action";
import { getRequiredCurrentUser } from "@/lib/user/get-user";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "Task Backlog | DevFlow",
  description: "Manage your tasks with Kanban prioritization",
};

export default async function BacklogPage() {
  await getRequiredCurrentUser();
  const t = await getTranslations("backlog");

  const { tasks } = await resolveActionResult(getTasksAction({}));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Typography variant="h1" className="mb-2">
          {t("pageTitle")}
        </Typography>
        <Typography variant="muted" className="text-lg">
          {t("pageDescription")}
        </Typography>
      </div>

      <BacklogClient initialTasks={tasks} />
    </div>
  );
}
