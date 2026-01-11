"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useZodForm,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LoadingButton } from "@/features/form/submit-button";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { createTaskAction, updateTaskAction } from "@/lib/actions/tasks.action";
import type { CreateTaskSchemaType } from "@/lib/actions/tasks.schema";
import { CreateTaskSchema } from "@/lib/actions/tasks.schema";
import type { Task } from "@/generated/prisma";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

type TaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
  onSuccess?: () => void;
};

export const TaskDialog = ({
  open,
  onOpenChange,
  task,
  onSuccess,
}: TaskDialogProps) => {
  const t = useTranslations();
  const isEdit = Boolean(task);

  const form = useZodForm({
    schema: CreateTaskSchema,
    defaultValues: {
      title: "",
      description: "",
      priority: "optional" as const,
      difficulty: 3,
      estimatedDuration: 60,
      deadline: "",
      quarter: "",
    },
  });

  // Reset form when task changes (edit mode)
  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description ?? "",
        priority: task.priority,
        difficulty: task.difficulty,
        estimatedDuration: task.estimatedDuration,
        deadline: task.deadline
          ? new Date(task.deadline).toISOString().split("T")[0]
          : "",
        quarter: task.quarter ?? "",
      });
    } else {
      form.reset({
        title: "",
        description: "",
        priority: "optional" as const,
        difficulty: 3,
        estimatedDuration: 60,
        deadline: "",
        quarter: "",
      });
    }
  }, [task, form]);

  const mutation = useMutation({
    mutationFn: async (values: CreateTaskSchemaType) => {
      if (isEdit && task) {
        return resolveActionResult(
          updateTaskAction({
            id: task.id,
            ...values,
          }),
        );
      }
      return resolveActionResult(createTaskAction(values));
    },
    onSuccess: () => {
      toast.success(
        isEdit ? t("task.dialog.taskUpdated") : t("task.dialog.taskCreated"),
      );
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : t("task.dialog.failedToSave"),
      );
    },
  });

  const onSubmit = async (values: CreateTaskSchemaType) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("task.dialog.editTitle") : t("task.dialog.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("task.dialog.editDescription")
              : t("task.dialog.createDescription")}
          </DialogDescription>
        </DialogHeader>

        <Form form={form} onSubmit={onSubmit} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("task.dialog.titleLabel")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("task.dialog.titlePlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("task.dialog.descriptionLabel")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t("task.dialog.descriptionPlaceholder")}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("task.dialog.priorityLabel")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("task.dialog.priorityPlaceholder")}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="sacred">
                        🔴 {t("backlog.priority.sacred")}
                      </SelectItem>
                      <SelectItem value="important">
                        🟠 {t("backlog.priority.important")}
                      </SelectItem>
                      <SelectItem value="optional">
                        🟢 {t("backlog.priority.optional")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="difficulty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("task.dialog.difficultyLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="estimatedDuration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("task.dialog.estimatedDurationLabel")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={480}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  {t("task.dialog.estimatedDurationDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="deadline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("task.dialog.deadlineLabel")}</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e.target.value ? e.target.value : "");
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quarter"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("task.dialog.quarterLabel")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("task.dialog.quarterPlaceholder")}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <LoadingButton type="submit" loading={mutation.isPending}>
              {isEdit ? t("task.update") : t("task.create")}
            </LoadingButton>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
