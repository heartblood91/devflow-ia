import { z } from "zod";

export const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  priority: z.enum(["sacred", "important", "optional"]).default("optional"),
  difficulty: z.number().min(1).max(5).default(3),
  estimatedDuration: z.number().min(1).max(480), // max 8h
  deadline: z.union([z.string().datetime(), z.literal("")]).optional(),
  quarter: z.string().optional(),
  subtasks: z.array(z.string()).optional(),
  dependencies: z.array(z.string()).optional(),
});

export const UpdateTaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  priority: z.enum(["sacred", "important", "optional"]).optional(),
  difficulty: z.number().min(1).max(5).optional(),
  estimatedDuration: z.number().min(1).max(480).optional(),
  deadline: z.union([z.string().datetime(), z.literal("")]).optional(),
  quarter: z.string().optional(),
  status: z.enum(["inbox", "todo", "doing", "done"]).optional(),
  kanbanColumn: z.enum(["inbox", "todo", "doing", "done"]).optional(),
});

export const DeleteTaskSchema = z.object({
  id: z.string(),
});

export const GetTasksSchema = z
  .object({
    priority: z.enum(["sacred", "important", "optional", "all"]).optional(),
    status: z.enum(["inbox", "todo", "doing", "done", "all"]).optional(),
    kanbanColumn: z.enum(["inbox", "todo", "doing", "done", "all"]).optional(),
  })
  .optional();

export const UpdateTaskColumnSchema = z.object({
  id: z.string(),
  kanbanColumn: z.enum(["inbox", "todo", "doing", "done"]),
});

export const RestoreTaskSchema = z.object({
  id: z.string(),
});

export const ArchiveTaskSchema = z.object({
  id: z.string(),
});

export type CreateTaskSchemaType = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskSchemaType = z.infer<typeof UpdateTaskSchema>;
export type DeleteTaskSchemaType = z.infer<typeof DeleteTaskSchema>;
export type GetTasksSchemaType = z.infer<typeof GetTasksSchema>;
export type UpdateTaskColumnSchemaType = z.infer<typeof UpdateTaskColumnSchema>;
export type RestoreTaskSchemaType = z.infer<typeof RestoreTaskSchema>;
export type ArchiveTaskSchemaType = z.infer<typeof ArchiveTaskSchema>;
