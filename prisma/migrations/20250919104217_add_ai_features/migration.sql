-- CreateTable
CREATE TABLE "public"."ai_chat_sessions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "session_token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "context_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_interactions" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "interaction_type" TEXT NOT NULL,
    "input_text" TEXT NOT NULL,
    "input_language" TEXT NOT NULL DEFAULT 'pt-BR',
    "processed_query" TEXT,
    "ai_response" JSONB,
    "execution_status" TEXT NOT NULL DEFAULT 'pending',
    "execution_time_ms" INTEGER,
    "confidence_score" DOUBLE PRECISION,
    "error_message" TEXT,
    "fallback_used" BOOLEAN NOT NULL DEFAULT false,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_insights" (
    "id" SERIAL NOT NULL,
    "interaction_id" INTEGER,
    "user_id" INTEGER NOT NULL,
    "insight_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "data_analysis" JSONB NOT NULL,
    "confidence_level" TEXT NOT NULL,
    "impact_score" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'active',
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_fallbacks" (
    "id" SERIAL NOT NULL,
    "trigger_pattern" TEXT NOT NULL,
    "fallback_type" TEXT NOT NULL,
    "response_template" TEXT NOT NULL,
    "escalation_level" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_fallbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_response_cache" (
    "id" SERIAL NOT NULL,
    "input_hash" TEXT NOT NULL,
    "input_text" TEXT NOT NULL,
    "response_data" JSONB NOT NULL,
    "interaction_type" TEXT NOT NULL,
    "hit_count" INTEGER NOT NULL DEFAULT 1,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_response_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_chat_sessions_session_token_key" ON "public"."ai_chat_sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "ai_response_cache_input_hash_key" ON "public"."ai_response_cache"("input_hash");

-- AddForeignKey
ALTER TABLE "public"."ai_chat_sessions" ADD CONSTRAINT "ai_chat_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_interactions" ADD CONSTRAINT "ai_interactions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."ai_chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_interactions" ADD CONSTRAINT "ai_interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_insights" ADD CONSTRAINT "ai_insights_interaction_id_fkey" FOREIGN KEY ("interaction_id") REFERENCES "public"."ai_interactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_insights" ADD CONSTRAINT "ai_insights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
