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

    revalidatePath("/app");
    revalidatePath("/app/backlog");

    return { success: true, taskId: task.id };
  });

export const updateTaskAction = authAction
  .inputSchema(UpdateTaskSchema)
  .action(async ({ parsedInput: data, ctx: { user } }) => {
    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findUnique({
      where: { id: data.id },
    });

    if (!existingTask) {
      throw new ActionError("Task not found");
    }

    if (existingTask.userId !== user.id) {
      throw new ActionError("Unauthorized");
    }

    const updateData: Prisma.TaskUpdateInput = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;
    if (data.estimatedDuration !== undefined)
      updateData.estimatedDuration = data.estimatedDuration;
    if (data.deadline !== undefined)
      updateData.deadline = data.deadline ? new Date(data.deadline) : null;
    if (data.quarter !== undefined) updateData.quarter = data.quarter;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.kanbanColumn !== undefined)
      updateData.kanbanColumn = data.kanbanColumn;

    const task = await prisma.task.update({
      where: { id: data.id },
      data: updateData,
    });

    revalidatePath("/app");
    revalidatePath("/app/backlog");

    return { success: true, task };
  });

export const deleteTaskAction = authAction
  .inputSchema(DeleteTaskSchema)
  .action(async ({ parsedInput: data, ctx: { user } }) => {
    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findUnique({
      where: { id: data.id },
    });

    if (!existingTask) {
      throw new ActionError("Task not found");
    }

    if (existingTask.userId !== user.id) {
      throw new ActionError("Unauthorized");
    }

    // Soft delete - set deletedAt timestamp
    // User can undo within 10 seconds via Toast
    await prisma.task.update({
      where: { id: data.id },
      data: { deletedAt: new Date() },
    });

    revalidatePath("/app");
    revalidatePath("/app/backlog");

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
    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findUnique({
      where: { id: data.id },
    });

    if (!existingTask) {
      throw new ActionError("Task not found");
    }

    if (existingTask.userId !== user.id) {
      throw new ActionError("Unauthorized");
    }

    await prisma.task.update({
      where: { id: data.id },
      data: {
        kanbanColumn: data.kanbanColumn,
        status: data.kanbanColumn,
        completedAt: data.kanbanColumn === "done" ? new Date() : null,
      },
    });

    revalidatePath("/app");
    revalidatePath("/app/backlog");

    return { success: true };
  });

export const restoreTaskAction = authAction
  .inputSchema(RestoreTaskSchema)
  .action(async ({ parsedInput: data, ctx: { user } }) => {
    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findUnique({
      where: { id: data.id },
    });

    if (!existingTask) {
      throw new ActionError("Task not found");
    }

    if (existingTask.userId !== user.id) {
      throw new ActionError("Unauthorized");
    }

    // Restore task by clearing deletedAt or archivedAt
    await prisma.task.update({
      where: { id: data.id },
      data: {
        deletedAt: null,
        archivedAt: null,
      },
    });

    revalidatePath("/app");
    revalidatePath("/app/backlog");

    return { success: true };
  });

export const archiveTaskAction = authAction
  .inputSchema(ArchiveTaskSchema)
  .action(async ({ parsedInput: data, ctx: { user } }) => {
    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findUnique({
      where: { id: data.id },
    });

    if (!existingTask) {
      throw new ActionError("Task not found");
    }

    if (existingTask.userId !== user.id) {
      throw new ActionError("Unauthorized");
    }

    // Can only archive completed tasks
    if (existingTask.status !== "done" || !existingTask.completedAt) {
      throw new ActionError("Can only archive completed tasks");
    }

    await prisma.task.update({
      where: { id: data.id },
      data: { archivedAt: new Date() },
    });

    revalidatePath("/app");
    revalidatePath("/app/backlog");

    return { success: true };
  });
