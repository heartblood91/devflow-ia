import { Typography } from "@/components/nowts/typography";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteConfig } from "@/site-config";
import {
  Calendar,
  Timer,
  ListTodo,
  MessageSquare,
  Terminal,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Documentation | ${SiteConfig.title}`,
  description:
    "Learn about DevFlow - Productivity system for developers with time-blocking, AI insights, and more",
  keywords: [
    "documentation",
    "productivity",
    "time-blocking",
    "developer tools",
  ],
};

export default function DocsPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mb-12 max-w-3xl">
        <Typography variant="h1" className="mb-4">
          DevFlow Documentation
        </Typography>
        <Typography variant="large" className="text-muted-foreground">
          A productivity system designed for 10x developers. DevFlow aggregates
          scientifically validated productivity concepts into a single
          application.
        </Typography>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="mb-2 flex items-center gap-2">
              <Calendar className="text-primary h-6 w-6" />
              <CardTitle>Weekly War Room</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Typography variant="p" className="text-muted-foreground">
              Sunday planning ritual to set objectives and allocate time blocks
              for the week ahead. Define your priorities and create a strategic
              plan.
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="mb-2 flex items-center gap-2">
              <Timer className="text-primary h-6 w-6" />
              <CardTitle>Focus Timer</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Typography variant="p" className="text-muted-foreground">
              Choose between Pomodoro (25/5 rhythm) or Ultradian (90/20 rhythm)
              cycles to maintain deep focus during work sessions.
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="mb-2 flex items-center gap-2">
              <ListTodo className="text-primary h-6 w-6" />
              <CardTitle>Task Backlog</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Typography variant="p" className="text-muted-foreground">
              Kanban-style task management with prioritization. Organize your
              work, set priorities, and track progress efficiently.
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="mb-2 flex items-center gap-2">
              <TrendingUp className="text-primary h-6 w-6" />
              <CardTitle>Daily Reflection</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Typography variant="p" className="text-muted-foreground">
              Evening review with AI-generated insights. Reflect on your day,
              learn from patterns, and continuously improve your workflow.
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="mb-2 flex items-center gap-2">
              <MessageSquare className="text-primary h-6 w-6" />
              <CardTitle>DevFlow AI</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Typography variant="p" className="text-muted-foreground">
              Proactive AI assistant that learns your patterns and provides
              contextual suggestions to optimize your productivity.
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="mb-2 flex items-center gap-2">
              <Terminal className="text-primary h-6 w-6" />
              <CardTitle>DevFlow CLI</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Typography variant="p" className="text-muted-foreground">
              Command-line interface for rapid task import. Capture ideas and
              tasks instantly from your terminal without context switching.
            </Typography>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-12">
        <CardHeader>
          <CardTitle>Core Principles</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <Typography variant="p">
                <strong>Time-blocking with chronotype optimization:</strong>{" "}
                Schedule deep work during your biological peak hours
              </Typography>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <Typography variant="p">
                <strong>Scientifically validated techniques:</strong> Based on
                research in productivity, cognitive psychology, and neuroscience
              </Typography>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <Typography variant="p">
                <strong>Sustainable productivity:</strong> Achieve high output
                without burnout through balanced work rhythms
              </Typography>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <Typography variant="p">
                <strong>AI-powered insights:</strong> Learn from your patterns
                and receive personalized recommendations
              </Typography>
            </li>
          </ul>
        </CardContent>
      </Card>

      <div className="bg-muted/50 mt-12 rounded-lg border p-6">
        <Typography variant="h3" className="mb-4">
          Getting Started
        </Typography>
        <Typography variant="p" className="text-muted-foreground mb-4">
          DevFlow is currently in active development (Phase 0 complete). Sign up
          now to be notified when new features launch!
        </Typography>
        <Typography variant="small" className="text-muted-foreground">
          Questions? Visit our{" "}
          <Link href="/contact" className="text-primary hover:underline">
            contact page
          </Link>{" "}
          or check our{" "}
          <a
            href="https://github.com/heartblood91/devflow-ia"
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub repository
          </a>
          .
        </Typography>
      </div>
    </div>
  );
}
