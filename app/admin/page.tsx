import { Typography } from "@/components/nowts/typography";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getRequiredAdmin } from "@/lib/auth/auth-user";
import { Users, MessageSquare, BarChart3, Settings } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard | DevFlow",
  description: "Administration dashboard for DevFlow",
};

export default async function AdminPage() {
  await getRequiredAdmin();
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Typography variant="h1" className="mb-2">
          Admin Dashboard
        </Typography>
        <Typography variant="muted" className="text-lg">
          Manage users, feedback, and system settings
        </Typography>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle>Users</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Typography variant="p" className="text-muted-foreground mb-4">
              Manage user accounts, roles, and permissions
            </Typography>
            <Button asChild>
              <Link href="/admin/users">Manage Users</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <CardTitle>Feedback</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Typography variant="p" className="text-muted-foreground mb-4">
              View and manage user feedback submissions
            </Typography>
            <Button asChild>
              <Link href="/admin/feedback">View Feedback</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <CardTitle>Analytics</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Typography variant="p" className="text-muted-foreground mb-4">
              View usage statistics and insights
            </Typography>
            <Button variant="secondary" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <CardTitle>Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Typography variant="p" className="text-muted-foreground mb-4">
              Configure system settings and preferences
            </Typography>
            <Button variant="secondary" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
