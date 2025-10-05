-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."account_activation_tokens" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_activation_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "account_activation_tokens_user_id_key" ON "public"."account_activation_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "account_activation_tokens_token_key" ON "public"."account_activation_tokens"("token");

-- AddForeignKey
ALTER TABLE "public"."account_activation_tokens" ADD CONSTRAINT "account_activation_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
