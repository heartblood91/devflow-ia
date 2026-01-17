"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import type { Task } from "@/generated/prisma";
import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";

type TaskCardProps = {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
};

const PRIORITY_EMOJIS = {
  sacred: "🔴",
  important: "🟠",
  optional: "🟢",
} as const;

const PRIORITY_COLORS = {
  sacred: "border-l-4 border-l-red-500",
  important: "border-l-4 border-l-orange-500",
  optional: "border-l-4 border-l-green-500",
} as const;

export const TaskCard = ({ task, onEdit, onDelete }: TaskCardProps) => {
  const t = useTranslations();
  const priorityEmoji = PRIORITY_EMOJIS[task.priority];
  const difficultyStars = `${task.difficulty}⭐`;
  const priorityColor = PRIORITY_COLORS[task.priority];

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  };

  return (
    <Card className={`w-full ${priorityColor}`}>
      <CardHeader className="flex flex-row flex-wrap items-center gap-2">
        <Badge variant="outline">
          {priorityEmoji} {task.priority}
        </Badge>
        <Badge variant="secondary">{difficultyStars}</Badge>
        {task.deadline && (
          <Badge variant="outline">{formatDate(task.deadline)}</Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-2">
        <h3 className="text-lg font-semibold">{task.title}</h3>

        {task.description && (
          <p className="text-muted-foreground text-sm">{task.description}</p>
        )}

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Clock className="size-4" />
            <span>
              {task.estimatedDuration} {t("task.minutes")}
            </span>
          </div>

          {task.quarter && <Badge variant="outline">{task.quarter}</Badge>}
        </div>

        {task.dependencies.length > 0 && (
          <div className="text-muted-foreground text-sm">
            ⚠️ {task.dependencies.length} {t("task.dependencies")}
          </div>
        )}
      </CardContent>

      <CardFooter className="gap-2">
        <Button variant="ghost" onClick={() => onEdit(task)}>
          {t("common.edit")}
        </Button>
        <Button variant="ghost" onClick={() => onDelete(task.id)}>
          {t("common.delete")}
        </Button>
      </CardFooter>
    </Card>
  );
};
