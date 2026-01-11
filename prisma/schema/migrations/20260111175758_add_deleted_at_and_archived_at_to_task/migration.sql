-- AlterTable
ALTER TABLE "public"."task" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "task_userId_deletedAt_idx" ON "public"."task"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "task_userId_archivedAt_idx" ON "public"."task"("userId", "archivedAt");
