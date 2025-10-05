/*
  Warnings:

  - You are about to drop the column `markdown` on the `ai_interactions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."ai_interactions" DROP COLUMN "markdown",
ADD COLUMN     "chartConfig" JSONB;
