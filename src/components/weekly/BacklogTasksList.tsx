"use client";

import { useState, useEffect, useTransition } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DraggableTaskCard } from "./DraggableTaskCard";
import { getBacklogTasksAction } from "@/lib/actions/getBacklogTasks.action";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import type { Task } from "@/generated/prisma";

type BacklogTasksListProps = {
  excludeTaskIds?: string[];
};

const TaskCardSkeleton = () => (
  <div className="flex animate-pulse flex-col gap-2 rounded-none border-2 border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-950">
    <div className="flex items-center gap-2">
      <div className="h-5 w-16 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-5 w-12 rounded bg-gray-200 dark:bg-gray-700" />
    </div>
    <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
    <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-700" />
  </div>
);

/**
 * Backlog tasks list for War Room planning.
 * Displays plannable tasks (sacred + important) that can be dragged to the planning preview.
 * Uses @dnd-kit/sortable for drag & drop functionality.
 */
export const BacklogTasksList = ({
  excludeTaskIds = [],
}: BacklogTasksListProps) => {
  const t = useTranslations("weekly.warRoomModal");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    const fetchTasks = async () => {
      try {
        const result = await resolveActionResult(getBacklogTasksAction({}));
        if (mounted) {
          setTasks(result.tasks);
        }
      } catch {
        if (mounted) {
          setTasks([]);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    startTransition(() => {
      void fetchTasks();
    });

    return () => {
      mounted = false;
    };
  }, []);

  const filteredTasks = tasks.filter(
    (task) => !excludeTaskIds.includes(task.id),
  );
  const taskIds = filteredTasks.map((task) => task.id);

  return (
    <Card
      className="flex h-full flex-col rounded-none border-2"
      data-testid="backlog-tasks-list"
    >
      <CardHeader className="shrink-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg">{t("backlogTasks")}</CardTitle>
          {!isLoading && (
            <Badge variant="secondary" className="rounded-none">
              {filteredTasks.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col gap-2">
            <TaskCardSkeleton />
            <TaskCardSkeleton />
            <TaskCardSkeleton />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground text-center text-sm">
              {t("noTasksToPlan")}
            </p>
          </div>
        ) : (
          <SortableContext
            items={taskIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-2">
              {filteredTasks.map((task) => (
                <DraggableTaskCard key={task.id} task={task} />
              ))}
            </div>
          </SortableContext>
        )}
      </CardContent>
    </Card>
  );
};
