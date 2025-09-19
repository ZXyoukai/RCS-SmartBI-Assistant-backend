/*
  Warnings:

  - A unique constraint covering the columns `[trigger_pattern]` on the table `ai_fallbacks` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ai_fallbacks_trigger_pattern_key" ON "public"."ai_fallbacks"("trigger_pattern");
