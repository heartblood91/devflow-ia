"use server";

/**
 * Server Actions for Task Management
 *
 * This file contains all server actions related to task management:
 * - Create, read, update, delete tasks
 * - Task status updates
 * - Task prioritization
 */

import { authAction } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";
import { revalidatePath } from "next/cache";
import {
  CreateTaskSchema,
  DeleteTaskSchema,
  GetTasksSchema,
  UpdateTaskColumnSchema,
  UpdateTaskSchema,
  RestoreTaskSchema,
  ArchiveTaskSchema,
} from "./tasks.schema";

/**
 * Helper to verify task ownership
 * Throws ActionError if task not found or doesn't belong to user
 */
const getOwnedTask = async (taskId: string, userId: string) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new ActionError("Task not found");
  }

  if (task.userId !== userId) {
    throw new ActionError("Unauthorized");
  }

  return task;
};

/**
 * Revalidate task-related pages
 */
const revalidateTaskPages = () => {
  revalidatePath("/app");
  revalidatePath("/app/backlog");
};

export const createTaskAction = authAction
  .inputSchema(CreateTaskSchema)
  .action(async ({ parsedInput: data, ctx: { user } }) => {
    const task = await prisma.task.create({
      data: {
        userId: user.id,
        title: data.title,
        priority: data.priority,
        difficulty: data.difficulty,
        estimatedDuration: data.estimatedDuration,
        status: "inbox",
        kanbanColumn: "inbox",
        dependencies: data.dependencies ?? [],
        description: data.description ?? null,
        deadline: data.deadline ? new Date(data.deadline) : null,
        quarter: data.quarter ?? null,
      },
    });

    // Create subtasks if provided
    if (data.subtasks && data.subtasks.length > 0) {
      const subtaskCount = data.subtasks.length;
      await prisma.task.createMany({
        data: data.subtasks.map((title) => ({
          userId: user.id,
          title,
          priority: data.priority,
          difficulty: data.difficulty,
          estimatedDuration: Math.floor(data.estimatedDuration / subtaskCount),
          parentTaskId: task.id,
          status: "inbox",
          kanbanColumn: "inbox",
          dependencies: [],
        })),
      });
    }

    revalidateTaskPages();

    return { success: true, taskId: task.id };
  });

export const updateTaskAction = authAction
  .inputSchema(UpdateTaskSchema)
  .action(async ({ parsedInput: data, ctx: { user } }) => {
    await getOwnedTask(data.id, user.id);

    // Build updateData only with defined fields
    const updateData: Prisma.TaskUpdateInput = {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.difficulty !== undefined && { difficulty: data.difficulty }),
      ...(data.estimatedDuration !== undefined && {
        estimatedDuration: data.estimatedDuration,
      }),
      ...(data.deadline !== undefined && {
        deadline: data.deadline ? new Date(data.deadline) : null,
      }),
      ...(data.quarter !== undefined && { quarter: data.quarter }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.kanbanColumn !== undefined && {
        kanbanColumn: data.kanbanColumn,
      }),
    };

    const task = await prisma.task.update({
      where: { id: data.id },
      data: updateData,
    });

    revalidateTaskPages();

    return { success: true, task };
  });

export const deleteTaskAction = authAction
  .inputSchema(DeleteTaskSchema)
  .action(async ({ parsedInput: data, ctx: { user } }) => {
    await getOwnedTask(data.id, user.id);

    // Soft delete - set deletedAt timestamp
    // User can undo within 10 seconds via Toast
    await prisma.task.update({
      where: { id: data.id },
      data: { deletedAt: new Date() },
    });

    revalidateTaskPages();

    return { success: true };
  });

export const getTasksAction = authAction
  .inputSchema(GetTasksSchema)
  .action(async ({ parsedInput: filters, ctx: { user } }) => {
    const where: Prisma.TaskWhereInput = {
      userId: user.id,
      // Exclude soft-deleted tasks by default
      deletedAt: null,
    };

    if (filters?.priority && filters.priority !== "all") {
      where.priority = filters.priority;
    }

    if (filters?.status && filters.status !== "all") {
      where.status = filters.status;
    }

    if (filters?.kanbanColumn && filters.kanbanColumn !== "all") {
      where.kanbanColumn = filters.kanbanColumn;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        subtasks: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { tasks };
  });

export const updateTaskColumnAction = authAction
  .inputSchema(UpdateTaskColumnSchema)
  .action(async ({ parsedInput: data, ctx: { user } }) => {
    await getOwnedTask(data.id, user.id);

    await prisma.task.update({
      where: { id: data.id },
      data: {
        kanbanColumn: data.kanbanColumn,
        status: data.kanbanColumn,
        completedAt: data.kanbanColumn === "done" ? new Date() : null,
      },
    });

    revalidateTaskPages();

    return { success: true };
  });

export const restoreTaskAction = authAction
  .inputSchema(RestoreTaskSchema)
  .action(async ({ parsedInput: data, ctx: { user } }) => {
    await getOwnedTask(data.id, user.id);

    // Restore task by clearing deletedAt or archivedAt
    await prisma.task.update({
      where: { id: data.id },
      data: {
        deletedAt: null,
        archivedAt: null,
      },
    });

    revalidateTaskPages();

    return { success: true };
  });

export const archiveTaskAction = authAction
  .inputSchema(ArchiveTaskSchema)
  .action(async ({ parsedInput: data, ctx: { user } }) => {
    const existingTask = await getOwnedTask(data.id, user.id);

    // Can only archive completed tasks
    if (existingTask.status !== "done" || !existingTask.completedAt) {
      throw new ActionError("Can only archive completed tasks");
    }

    await prisma.task.update({
      where: { id: data.id },
      data: { archivedAt: new Date() },
    });

    revalidateTaskPages();

    return { success: true };
  });
