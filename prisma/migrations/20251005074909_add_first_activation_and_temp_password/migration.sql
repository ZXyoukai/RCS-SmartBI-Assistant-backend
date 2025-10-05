-- AlterTable
ALTER TABLE "public"."account_activation_tokens" ADD COLUMN     "is_first_activation" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "temp_password" TEXT;
