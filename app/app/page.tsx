import { Typography } from "@/components/nowts/typography";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRequiredCurrentUser } from "@/lib/user/get-user";
import { Calendar, Timer, ListTodo, MessageSquare } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | DevFlow",
  description:
    "Your productivity dashboard - Time-blocking, tasks, and insights",
};

export default async function AppPage() {
  const user = await getRequiredCurrentUser();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Typography variant="h1" className="mb-2">
          Welcome back, {user.name}! 👋
        </Typography>
        <Typography variant="muted" className="text-lg">
          Your DevFlow dashboard - Let's make today productive
        </Typography>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Weekly War Room
            </CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Coming Soon</div>
            <p className="text-muted-foreground text-xs">
              Sunday planning ritual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Focus Timer</CardTitle>
            <Timer className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Coming Soon</div>
            <p className="text-muted-foreground text-xs">
              Pomodoro / Ultradian
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Backlog</CardTitle>
            <ListTodo className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Coming Soon</div>
            <p className="text-muted-foreground text-xs">
              Kanban prioritization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DevFlow AI</CardTitle>
            <MessageSquare className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Coming Soon</div>
            <p className="text-muted-foreground text-xs">AI insights & chat</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>🚀 Phase 0 Complete</CardTitle>
        </CardHeader>
        <CardContent>
          <Typography variant="p" className="mb-4">
            The foundation is ready! We're building DevFlow features in phases:
          </Typography>
          <ul className="text-muted-foreground space-y-2 text-sm">
            <li>✅ Phase 0: Cleanup & Setup (Complete)</li>
            <li>⏳ Phase 1: Design & Wireframes</li>
            <li>⏳ Phase 2: Database Schema</li>
            <li>⏳ Phase 3: Authentication</li>
            <li>⏳ Phase 4: Task Backlog</li>
            <li>⏳ Phase 5: Weekly War Room</li>
            <li>⏳ Phase 6: Daily Dashboard & Reflection</li>
            <li>⏳ Phase 7: DevFlow CLI</li>
            <li>⏳ Phase 8: DevFlow AI</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
