import { Typography } from "@/components/nowts/typography";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRequiredCurrentUser } from "@/lib/user/get-user";
import { prisma } from "@/lib/prisma";
import { Calendar, Timer, ListTodo, MessageSquare } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "Dashboard | DevFlow",
  description:
    "Your productivity dashboard - Time-blocking, tasks, and insights",
};

export default async function AppPage() {
  const user = await getRequiredCurrentUser();
  const t = await getTranslations("dashboard");

  // Get task statistics
  const taskStats = await prisma.task.groupBy({
    by: ["kanbanColumn"],
    where: { userId: user.id },
    _count: true,
  });

  const inboxTasks =
    taskStats.find((s) => s.kanbanColumn === "inbox")?._count ?? 0;
  const activeTasks =
    taskStats.find((s) => s.kanbanColumn === "doing")?._count ?? 0;
  const doneTasks =
    taskStats.find((s) => s.kanbanColumn === "done")?._count ?? 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Typography variant="h1" className="mb-2">
          {t("welcomeBack", { name: user.name })}
        </Typography>
        <Typography variant="muted" className="text-lg">
          {t("subtitle")}
        </Typography>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("weeklyWarRoom")}
            </CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{t("comingSoon")}</div>
            <p className="text-muted-foreground text-xs">{t("sundayRitual")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("focusTimer")}
            </CardTitle>
            <Timer className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{t("comingSoon")}</div>
            <p className="text-muted-foreground text-xs">
              {t("pomodoroUltradian")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("taskBacklog")}
            </CardTitle>
            <ListTodo className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeTasks}{" "}
              <span className="text-base font-normal">{t("active")}</span>
            </div>
            <p className="text-muted-foreground text-xs">
              {inboxTasks} todo, {doneTasks} done
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("devflowAI")}
            </CardTitle>
            <MessageSquare className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{t("comingSoon")}</div>
            <p className="text-muted-foreground text-xs">{t("aiInsights")}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
