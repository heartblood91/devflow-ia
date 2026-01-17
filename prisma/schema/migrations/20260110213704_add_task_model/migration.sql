-- CreateEnum
CREATE TYPE "public"."Priority" AS ENUM ('sacred', 'important', 'optional');

-- CreateEnum
CREATE TYPE "public"."TaskStatus" AS ENUM ('inbox', 'todo', 'doing', 'done');

-- CreateEnum
CREATE TYPE "public"."KanbanColumn" AS ENUM ('inbox', 'todo', 'doing', 'done');

-- CreateTable
CREATE TABLE "public"."task" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "public"."Priority" NOT NULL DEFAULT 'optional',
    "difficulty" INTEGER NOT NULL DEFAULT 3,
    "estimatedDuration" INTEGER NOT NULL,
    "status" "public"."TaskStatus" NOT NULL DEFAULT 'inbox',
    "kanbanColumn" "public"."KanbanColumn" NOT NULL DEFAULT 'inbox',
    "deadline" TIMESTAMP(3),
    "quarter" TEXT,
    "parentTaskId" TEXT,
    "dependencies" TEXT[],
    "weekSkippedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_userId_status_idx" ON "public"."task"("userId", "status");

-- CreateIndex
CREATE INDEX "task_userId_priority_idx" ON "public"."task"("userId", "priority");

-- AddForeignKey
ALTER TABLE "public"."task" ADD CONSTRAINT "task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task" ADD CONSTRAINT "task_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "public"."task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
