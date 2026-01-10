/*
  Warnings:

  - You are about to drop the column `stripeCustomerId` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `subscription` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."subscription" DROP CONSTRAINT "subscription_referenceId_fkey";

-- AlterTable
ALTER TABLE "public"."user" DROP COLUMN "stripeCustomerId";

-- DropTable
DROP TABLE "public"."subscription";
