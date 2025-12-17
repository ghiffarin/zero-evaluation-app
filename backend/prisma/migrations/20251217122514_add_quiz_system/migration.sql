-- CreateTable
CREATE TABLE "quizzes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'id',
    "difficulty" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "total_questions" INTEGER NOT NULL,
    "recommended_time_min" INTEGER NOT NULL,
    "correct_points" INTEGER NOT NULL DEFAULT 1,
    "wrong_points" INTEGER NOT NULL DEFAULT 0,
    "max_score" INTEGER NOT NULL,
    "sections_json" JSONB NOT NULL,
    "questions_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_attempts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "is_randomized" BOOLEAN NOT NULL DEFAULT false,
    "randomized_order_json" JSONB,
    "current_question_index" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "time_spent_seconds" INTEGER,
    "last_saved_at" TIMESTAMP(3),
    "score" INTEGER,
    "max_score" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION,
    "answers_json" JSONB NOT NULL DEFAULT '{}',
    "results_json" JSONB,

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quizzes_user_id_idx" ON "quizzes"("user_id");

-- CreateIndex
CREATE INDEX "quiz_attempts_user_id_idx" ON "quiz_attempts"("user_id");

-- CreateIndex
CREATE INDEX "quiz_attempts_quiz_id_idx" ON "quiz_attempts"("quiz_id");

-- CreateIndex
CREATE INDEX "quiz_attempts_user_id_quiz_id_idx" ON "quiz_attempts"("user_id", "quiz_id");

-- CreateIndex
CREATE INDEX "quiz_attempts_status_idx" ON "quiz_attempts"("status");

-- CreateIndex
CREATE INDEX "book_reading_sessions_user_id_date_idx" ON "book_reading_sessions"("user_id", "date");

-- CreateIndex
CREATE INDEX "career_activities_user_id_date_idx" ON "career_activities"("user_id", "date");

-- CreateIndex
CREATE INDEX "career_activity_logs_user_id_date_idx" ON "career_activity_logs"("user_id", "date");

-- CreateIndex
CREATE INDEX "daily_logs_user_id_date_idx" ON "daily_logs"("user_id", "date");

-- CreateIndex
CREATE INDEX "financial_transactions_user_id_date_idx" ON "financial_transactions"("user_id", "date");

-- CreateIndex
CREATE INDEX "ielts_sessions_user_id_date_idx" ON "ielts_sessions"("user_id", "date");

-- CreateIndex
CREATE INDEX "skill_sessions_user_id_date_idx" ON "skill_sessions"("user_id", "date");

-- CreateIndex
CREATE INDEX "wellness_entries_user_id_date_idx" ON "wellness_entries"("user_id", "date");

-- CreateIndex
CREATE INDEX "workout_sessions_user_id_date_idx" ON "workout_sessions"("user_id", "date");

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
