import { z } from "zod";

/**
 * Schema for getBacklogTasks action
 * No input parameters - fetches plannable tasks for authenticated user
 */
export const GetBacklogTasksSchema = z.object({});
