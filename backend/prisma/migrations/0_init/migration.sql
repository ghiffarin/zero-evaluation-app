-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('personal', 'career', 'academic', 'health', 'finance', 'other');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('active', 'paused', 'completed', 'archived');

-- CreateEnum
CREATE TYPE "GoalCategory" AS ENUM ('fitness', 'finance', 'learning', 'career', 'masters', 'wellness', 'skill', 'other');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('not_started', 'in_progress', 'achieved', 'dropped');

-- CreateEnum
CREATE TYPE "IeltsSkillType" AS ENUM ('listening', 'reading', 'writing_task1', 'writing_task2', 'speaking');

-- CreateEnum
CREATE TYPE "IeltsMistakeCategory" AS ENUM ('grammar', 'vocab', 'spelling', 'paraphrasing', 'logic', 'pronunciation', 'timing', 'comprehension', 'other');

-- CreateEnum
CREATE TYPE "VocabSourceType" AS ENUM ('ielts', 'book', 'journal', 'other');

-- CreateEnum
CREATE TYPE "JournalCategory" AS ENUM ('microalgae', 'co2_fixation', 'bioprocess', 'sustainability', 'engineering', 'data_science', 'other');

-- CreateEnum
CREATE TYPE "JournalContentType" AS ENUM ('review', 'original', 'thesis', 'book_chapter', 'report', 'conference', 'other');

-- CreateEnum
CREATE TYPE "BookStatus" AS ENUM ('to_read', 'reading', 'completed', 'dropped');

-- CreateEnum
CREATE TYPE "BookReadingPurpose" AS ENUM ('language', 'leisure', 'inspiration', 'knowledge', 'rest', 'other');

-- CreateEnum
CREATE TYPE "SkillCategory" AS ENUM ('uiux', 'framer', 'writing', 'pm', 'data', 'engineering', 'programming', 'career', 'language', 'other');

-- CreateEnum
CREATE TYPE "WorkoutType" AS ENUM ('jogging', 'walking', 'strength', 'hiit', 'swimming', 'cycling', 'stretching', 'yoga', 'sports', 'other');

-- CreateEnum
CREATE TYPE "WorkoutFocus" AS ENUM ('endurance', 'fat_burn', 'strength', 'core', 'mobility', 'recovery', 'cardio', 'other');

-- CreateEnum
CREATE TYPE "StrokeType" AS ENUM ('freestyle', 'backstroke', 'breaststroke', 'butterfly', 'mixed');

-- CreateEnum
CREATE TYPE "FinancialDirection" AS ENUM ('spend', 'invest', 'income');

-- CreateEnum
CREATE TYPE "FinancialCategory" AS ENUM ('food', 'transport', 'groceries', 'household', 'entertainment', 'health', 'phone', 'internet', 'subscription', 'family_support', 'work', 'education', 'savings', 'investment', 'salary', 'freelance', 'other');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'debit', 'e_wallet', 'credit', 'transfer');

-- CreateEnum
CREATE TYPE "InvestmentType" AS ENUM ('bitcoin', 'savings', 'emergency_fund', 'stocks', 'mutual_funds', 'business', 'gold', 'other');

-- CreateEnum
CREATE TYPE "CareerActivityType" AS ENUM ('job_application', 'portfolio', 'cv', 'cover_letter', 'networking', 'linkedin_post', 'learning', 'interview_prep', 'company_research', 'strategy', 'certification', 'other');

-- CreateEnum
CREATE TYPE "CareerPipelineStage" AS ENUM ('not_applicable', 'not_started', 'in_progress', 'submitted', 'interview', 'follow_up', 'waiting', 'completed', 'rejected');

-- CreateEnum
CREATE TYPE "JobApplicationStatus" AS ENUM ('draft', 'applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn', 'accepted');

-- CreateEnum
CREATE TYPE "MastersPrepCategory" AS ENUM ('ielts', 'journal', 'research_skills', 'technical', 'writing', 'portfolio', 'project_experience', 'cv_docs', 'recommendations', 'financial', 'strategy', 'university_research', 'other');

-- CreateEnum
CREATE TYPE "MastersPrepStatus" AS ENUM ('not_started', 'in_progress', 'halfway', 'almost_done', 'completed');

-- CreateEnum
CREATE TYPE "ScholarshipType" AS ENUM ('full', 'partial', 'tuition', 'living', 'travel', 'research', 'other');

-- CreateEnum
CREATE TYPE "ScholarshipStatus" AS ENUM ('researching', 'eligible', 'applying', 'applied', 'awarded', 'rejected', 'expired');

-- CreateEnum
CREATE TYPE "UniversityStatus" AS ENUM ('researching', 'shortlisted', 'applying', 'applied', 'accepted', 'rejected', 'enrolled');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Jakarta',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ProjectType" NOT NULL DEFAULT 'personal',
    "status" "ProjectStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "project_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "GoalCategory" NOT NULL,
    "target_value" DOUBLE PRECISION,
    "current_value" DOUBLE PRECISION DEFAULT 0,
    "unit" TEXT,
    "due_date" DATE,
    "status" "GoalStatus" NOT NULL DEFAULT 'not_started',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "goal_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag_links" (
    "id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,

    CONSTRAINT "tag_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "main_focus" TEXT,
    "work_hours" DOUBLE PRECISION,
    "learning_hours" DOUBLE PRECISION,
    "workout_minutes" INTEGER,
    "money_spent" DOUBLE PRECISION,
    "mood_score" INTEGER,
    "energy_score" INTEGER,
    "sleep_hours" DOUBLE PRECISION,
    "steps" INTEGER,
    "day_score" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ielts_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "skill_type" "IeltsSkillType" NOT NULL,
    "sub_skill" TEXT,
    "material_name" TEXT,
    "time_spent_min" INTEGER,
    "raw_score" DOUBLE PRECISION,
    "raw_max_score" DOUBLE PRECISION,
    "estimated_band" DOUBLE PRECISION,
    "mistakes_summary" TEXT,
    "new_vocab_count" INTEGER,
    "confidence_score" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ielts_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ielts_mistakes" (
    "id" TEXT NOT NULL,
    "ielts_session_id" TEXT NOT NULL,
    "category" "IeltsMistakeCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "example" TEXT,

    CONSTRAINT "ielts_mistakes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ielts_vocab" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ielts_session_id" TEXT,
    "phrase" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "example_usage" TEXT,
    "source_type" "VocabSourceType" NOT NULL DEFAULT 'ielts',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ielts_vocab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "title" TEXT NOT NULL,
    "authors" TEXT,
    "source" TEXT,
    "category" "JournalCategory" NOT NULL DEFAULT 'other',
    "content_type" "JournalContentType" NOT NULL DEFAULT 'original',
    "time_spent_min" INTEGER,
    "summary" TEXT,
    "key_insights" TEXT,
    "key_data_points" TEXT,
    "methods_summary" TEXT,
    "models_equations" TEXT,
    "limitations" TEXT,
    "open_question" TEXT,
    "project_relevance" TEXT,
    "confidence_score" INTEGER,
    "rating_usefulness" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "books" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "total_pages" INTEGER,
    "genre" TEXT,
    "language" TEXT DEFAULT 'English',
    "status" "BookStatus" NOT NULL DEFAULT 'reading',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_reading_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "chapter_label" TEXT,
    "pages_start" INTEGER,
    "pages_end" INTEGER,
    "pages_read" INTEGER,
    "time_spent_min" INTEGER,
    "reading_speed" DOUBLE PRECISION,
    "summary" TEXT,
    "key_ideas" TEXT,
    "favorite_lines" TEXT,
    "new_vocab" TEXT,
    "emotion_score" INTEGER,
    "emotion_label" TEXT,
    "purpose" "BookReadingPurpose" NOT NULL DEFAULT 'knowledge',
    "focus_score" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "book_reading_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "skill_category" "SkillCategory" NOT NULL,
    "sub_skill" TEXT,
    "project_id" TEXT,
    "time_spent_min" INTEGER,
    "output_summary" TEXT,
    "output_link" TEXT,
    "learned_points" TEXT,
    "difficulty" INTEGER,
    "mastery_level" INTEGER,
    "mistakes" TEXT,
    "next_step" TEXT,
    "energy_score" INTEGER,
    "quality_score" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "workout_type" "WorkoutType" NOT NULL,
    "routine_name" TEXT,
    "duration_min" INTEGER,
    "distance_km" DOUBLE PRECISION,
    "pace_min_per_km" DOUBLE PRECISION,
    "steps" INTEGER,
    "cadence" INTEGER,
    "elevation_gain" INTEGER,
    "elevation_loss" INTEGER,
    "avg_speed" DOUBLE PRECISION,
    "max_speed" DOUBLE PRECISION,
    "avg_heart_rate" INTEGER,
    "max_heart_rate" INTEGER,
    "laps" INTEGER,
    "pool_length" INTEGER,
    "stroke_type" "StrokeType",
    "stroke_count" INTEGER,
    "swolf_score" INTEGER,
    "total_volume" DOUBLE PRECISION,
    "total_sets" INTEGER,
    "total_reps" INTEGER,
    "rpe" INTEGER,
    "avg_rest_time" INTEGER,
    "rounds" INTEGER,
    "work_interval" INTEGER,
    "rest_interval" INTEGER,
    "calories" INTEGER,
    "intensity_level" INTEGER,
    "focus" "WorkoutFocus" NOT NULL DEFAULT 'endurance',
    "pre_energy" INTEGER,
    "post_mood" TEXT,
    "workout_quality" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workout_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_sets" (
    "id" TEXT NOT NULL,
    "workout_session_id" TEXT NOT NULL,
    "exercise_name" TEXT NOT NULL,
    "set_number" INTEGER NOT NULL,
    "reps" INTEGER,
    "weight_kg" DOUBLE PRECISION,
    "duration_sec" INTEGER,
    "rest_after_sec" INTEGER,
    "rpe" INTEGER,
    "notes" TEXT,

    CONSTRAINT "workout_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wellness_entries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "sleep_hours" DOUBLE PRECISION,
    "sleep_quality" INTEGER,
    "energy_level" INTEGER,
    "appetite_control" INTEGER,
    "hydration_liters" DOUBLE PRECISION,
    "physical_symptoms" TEXT,
    "sunlight_minutes" INTEGER,
    "mood_score" INTEGER,
    "stress_level" INTEGER,
    "mental_clarity" INTEGER,
    "anxiety_level" INTEGER,
    "screen_time_min" INTEGER,
    "social_time_min" INTEGER,
    "outdoor_time_min" INTEGER,
    "hygiene_score" INTEGER,
    "diet_discipline" INTEGER,
    "no_late_snacks" BOOLEAN,
    "morning_routine" BOOLEAN,
    "evening_routine" BOOLEAN,
    "wellness_note" TEXT,
    "wellness_score" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wellness_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "amount_idr" DOUBLE PRECISION NOT NULL,
    "direction" "FinancialDirection" NOT NULL,
    "category" "FinancialCategory" NOT NULL,
    "is_necessary" BOOLEAN,
    "payment_method" "PaymentMethod",
    "investment_type" "InvestmentType",
    "description" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reflection_entries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "went_well" TEXT,
    "went_wrong" TEXT,
    "root_cause" TEXT,
    "learned_today" TEXT,
    "fix_for_tomorrow" TEXT,
    "integrity_score" INTEGER,
    "discipline_score" INTEGER,
    "emotional_state" TEXT,
    "gratitude" TEXT,
    "day_lesson" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reflection_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_activities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "activity_type" "CareerActivityType" NOT NULL,
    "subcategory" TEXT,
    "target_entity" TEXT,
    "project_id" TEXT,
    "job_application_id" TEXT,
    "time_spent_min" INTEGER,
    "description" TEXT,
    "output_summary" TEXT,
    "output_link" TEXT,
    "pipeline_stage" "CareerPipelineStage",
    "priority" INTEGER,
    "confidence" INTEGER,
    "career_impact" INTEGER,
    "next_step" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "career_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_activity_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "activity_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "time_spent_min" INTEGER,
    "progress" TEXT,
    "outcome" TEXT,
    "next_step" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "career_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_applications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role_title" TEXT NOT NULL,
    "link" TEXT,
    "status" "JobApplicationStatus" NOT NULL DEFAULT 'draft',
    "contact_name" TEXT,
    "contact_email" TEXT,
    "contacts" JSONB,
    "applied_date" DATE,
    "expected_response" DATE,
    "salary" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "masters_prep_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category" "MastersPrepCategory" NOT NULL,
    "subcategory" TEXT,
    "task_title" TEXT NOT NULL,
    "description" TEXT,
    "related_goal_id" TEXT,
    "university_id" TEXT,
    "scholarship_id" TEXT,
    "priority" INTEGER,
    "status" "MastersPrepStatus" NOT NULL DEFAULT 'not_started',
    "progress_percent" INTEGER DEFAULT 0,
    "time_spent_min" INTEGER,
    "output_summary" TEXT,
    "output_link" TEXT,
    "readiness_score" INTEGER,
    "next_step" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "masters_prep_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "masters_prep_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "prep_item_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "time_spent_min" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "masters_prep_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "masters_prep_notes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "link" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "masters_prep_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "universities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "university_name" TEXT NOT NULL,
    "country" TEXT,
    "city" TEXT,
    "program_name" TEXT,
    "specialization" TEXT,
    "program_length" TEXT,
    "program_format" TEXT,
    "program_start_date" TEXT,
    "tuition_per_year" TEXT,
    "living_cost_per_year" TEXT,
    "application_fee" TEXT,
    "admission_requirements" TEXT,
    "required_documents" TEXT,
    "english_test" TEXT,
    "ielts_min_score" DOUBLE PRECISION,
    "toefl_min_score" INTEGER,
    "language_of_instruction" TEXT,
    "application_deadline" TEXT,
    "application_open_date" TEXT,
    "decision_date" TEXT,
    "funding_options" TEXT,
    "scholarship_available" BOOLEAN,
    "website_url" TEXT,
    "application_portal_url" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "class_size" INTEGER,
    "acceptance_rate" DOUBLE PRECISION,
    "personal_fit_score" INTEGER,
    "pros" TEXT,
    "cons" TEXT,
    "alumni_notes" TEXT,
    "related_contacts" JSONB,
    "notes" TEXT,
    "priority" INTEGER,
    "status" "UniversityStatus" NOT NULL DEFAULT 'researching',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "universities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scholarships" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "university_id" TEXT,
    "name" TEXT NOT NULL,
    "provider" TEXT,
    "type" "ScholarshipType" NOT NULL DEFAULT 'partial',
    "amount" TEXT,
    "currency" TEXT,
    "coverage" TEXT,
    "eligibility" TEXT,
    "application_link" TEXT,
    "website_url" TEXT,
    "deadline" TEXT,
    "status" "ScholarshipStatus" NOT NULL DEFAULT 'researching',
    "priority" INTEGER,
    "notes" TEXT,
    "funding" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scholarships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tags_user_id_label_key" ON "tags"("user_id", "label");

-- CreateIndex
CREATE INDEX "tag_links_entity_type_entity_id_idx" ON "tag_links"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "tag_links_tag_id_entity_type_entity_id_key" ON "tag_links"("tag_id", "entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "daily_logs_user_id_date_key" ON "daily_logs"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "wellness_entries_user_id_date_key" ON "wellness_entries"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "reflection_entries_user_id_date_key" ON "reflection_entries"("user_id", "date");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_progress" ADD CONSTRAINT "goal_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_progress" ADD CONSTRAINT "goal_progress_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_links" ADD CONSTRAINT "tag_links_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_logs" ADD CONSTRAINT "daily_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ielts_sessions" ADD CONSTRAINT "ielts_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ielts_mistakes" ADD CONSTRAINT "ielts_mistakes_ielts_session_id_fkey" FOREIGN KEY ("ielts_session_id") REFERENCES "ielts_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ielts_vocab" ADD CONSTRAINT "ielts_vocab_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ielts_vocab" ADD CONSTRAINT "ielts_vocab_ielts_session_id_fkey" FOREIGN KEY ("ielts_session_id") REFERENCES "ielts_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "books" ADD CONSTRAINT "books_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_reading_sessions" ADD CONSTRAINT "book_reading_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_reading_sessions" ADD CONSTRAINT "book_reading_sessions_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_sessions" ADD CONSTRAINT "skill_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_sessions" ADD CONSTRAINT "skill_sessions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_workout_session_id_fkey" FOREIGN KEY ("workout_session_id") REFERENCES "workout_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wellness_entries" ADD CONSTRAINT "wellness_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reflection_entries" ADD CONSTRAINT "reflection_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_activities" ADD CONSTRAINT "career_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_activities" ADD CONSTRAINT "career_activities_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_activities" ADD CONSTRAINT "career_activities_job_application_id_fkey" FOREIGN KEY ("job_application_id") REFERENCES "job_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_activity_logs" ADD CONSTRAINT "career_activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_activity_logs" ADD CONSTRAINT "career_activity_logs_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "career_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "masters_prep_items" ADD CONSTRAINT "masters_prep_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "masters_prep_items" ADD CONSTRAINT "masters_prep_items_related_goal_id_fkey" FOREIGN KEY ("related_goal_id") REFERENCES "goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "masters_prep_items" ADD CONSTRAINT "masters_prep_items_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "masters_prep_items" ADD CONSTRAINT "masters_prep_items_scholarship_id_fkey" FOREIGN KEY ("scholarship_id") REFERENCES "scholarships"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "masters_prep_sessions" ADD CONSTRAINT "masters_prep_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "masters_prep_sessions" ADD CONSTRAINT "masters_prep_sessions_prep_item_id_fkey" FOREIGN KEY ("prep_item_id") REFERENCES "masters_prep_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "masters_prep_notes" ADD CONSTRAINT "masters_prep_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "universities" ADD CONSTRAINT "universities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scholarships" ADD CONSTRAINT "scholarships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scholarships" ADD CONSTRAINT "scholarships_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

