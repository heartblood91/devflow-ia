import { BacklogClient } from "@/components/backlog/backlog-client";
import { Typography } from "@/components/nowts/typography";
import { getTasksAction } from "@/lib/actions/tasks.action";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { getRequiredCurrentUser } from "@/lib/user/get-user";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Task Backlog | DevFlow",
  description: "Manage your tasks with Kanban prioritization",
};

export default async function BacklogPage() {
  await getRequiredCurrentUser();

  const { tasks } = await resolveActionResult(getTasksAction({}));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Typography variant="h1" className="mb-2">
          Task Backlog
        </Typography>
        <Typography variant="muted" className="text-lg">
          Organize and prioritize your tasks with Kanban
        </Typography>
      </div>

      <BacklogClient initialTasks={tasks} />
    </div>
  );
}
