/*
  Warnings:

  - Added the required column `type` to the `associated_databases` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."associated_databases" ADD COLUMN     "type" TEXT NOT NULL;
