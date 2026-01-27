-- CreateEnum
CREATE TYPE "SafetyKitLocation" AS ENUM ('kost', 'home', 'motorbag');

-- CreateEnum
CREATE TYPE "SafetyItemCategory" AS ENUM ('health', 'power', 'weather', 'safety', 'tools');

-- CreateEnum
CREATE TYPE "SafetyItemPriority" AS ENUM ('critical', 'high', 'normal');

-- CreateEnum
CREATE TYPE "SafetyItemStatus" AS ENUM ('ok', 'low', 'out', 'replace');

-- CreateEnum
CREATE TYPE "KitCheckType" AS ENUM ('weekly', 'before_trip');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('health', 'weather', 'power', 'safety', 'transport');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('low', 'med', 'high');

-- CreateTable
CREATE TABLE "safety_kits" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" "SafetyKitLocation" NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "safety_kits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_kit_items" (
    "id" TEXT NOT NULL,
    "safety_kit_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "SafetyItemCategory" NOT NULL,
    "priority" "SafetyItemPriority" NOT NULL,
    "status" "SafetyItemStatus" NOT NULL DEFAULT 'ok',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "min_quantity" INTEGER NOT NULL DEFAULT 1,
    "unit" TEXT,
    "expiry_date" DATE,
    "purchase_date" DATE,
    "estimated_price" DOUBLE PRECISION,
    "last_checked_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "safety_kit_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kit_checks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "safety_kit_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "check_type" "KitCheckType" NOT NULL,
    "readiness_score" DOUBLE PRECISION,
    "total_items" INTEGER,
    "items_ready" INTEGER,
    "items_issue" INTEGER,
    "duration" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kit_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kit_check_lines" (
    "id" TEXT NOT NULL,
    "kit_check_id" TEXT NOT NULL,
    "safety_kit_item_id" TEXT NOT NULL,
    "status_found" "SafetyItemStatus" NOT NULL,
    "quantity_found" INTEGER NOT NULL,
    "is_ok" BOOLEAN NOT NULL,
    "notes" TEXT,

    CONSTRAINT "kit_check_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "time" TEXT,
    "location" TEXT,
    "incident_type" "IncidentType" NOT NULL,
    "severity" "IncidentSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "what_happened" TEXT,
    "how_resolved" TEXT,
    "lessons_learned" TEXT,
    "was_kit_used" BOOLEAN NOT NULL DEFAULT false,
    "kit_helpful" INTEGER,
    "estimated_saved" DOUBLE PRECISION,
    "total_expense" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_items" (
    "id" TEXT NOT NULL,
    "incident_id" TEXT NOT NULL,
    "safety_kit_item_id" TEXT NOT NULL,
    "quantity_used" INTEGER NOT NULL DEFAULT 1,
    "was_helpful" BOOLEAN NOT NULL DEFAULT true,
    "was_missing" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "incident_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_expenses" (
    "id" TEXT NOT NULL,
    "incident_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount_idr" DOUBLE PRECISION NOT NULL,
    "date" DATE NOT NULL,
    "notes" TEXT,

    CONSTRAINT "incident_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "safety_kits_user_id_idx" ON "safety_kits"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "safety_kits_user_id_location_key" ON "safety_kits"("user_id", "location");

-- CreateIndex
CREATE INDEX "safety_kit_items_safety_kit_id_idx" ON "safety_kit_items"("safety_kit_id");

-- CreateIndex
CREATE INDEX "kit_checks_user_id_date_idx" ON "kit_checks"("user_id", "date");

-- CreateIndex
CREATE INDEX "kit_checks_safety_kit_id_idx" ON "kit_checks"("safety_kit_id");

-- CreateIndex
CREATE UNIQUE INDEX "kit_check_lines_kit_check_id_safety_kit_item_id_key" ON "kit_check_lines"("kit_check_id", "safety_kit_item_id");

-- CreateIndex
CREATE INDEX "incidents_user_id_date_idx" ON "incidents"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "incident_items_incident_id_safety_kit_item_id_key" ON "incident_items"("incident_id", "safety_kit_item_id");

-- CreateIndex
CREATE INDEX "incident_expenses_incident_id_idx" ON "incident_expenses"("incident_id");

-- AddForeignKey
ALTER TABLE "safety_kits" ADD CONSTRAINT "safety_kits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_kit_items" ADD CONSTRAINT "safety_kit_items_safety_kit_id_fkey" FOREIGN KEY ("safety_kit_id") REFERENCES "safety_kits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kit_checks" ADD CONSTRAINT "kit_checks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kit_checks" ADD CONSTRAINT "kit_checks_safety_kit_id_fkey" FOREIGN KEY ("safety_kit_id") REFERENCES "safety_kits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kit_check_lines" ADD CONSTRAINT "kit_check_lines_kit_check_id_fkey" FOREIGN KEY ("kit_check_id") REFERENCES "kit_checks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kit_check_lines" ADD CONSTRAINT "kit_check_lines_safety_kit_item_id_fkey" FOREIGN KEY ("safety_kit_item_id") REFERENCES "safety_kit_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_items" ADD CONSTRAINT "incident_items_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_items" ADD CONSTRAINT "incident_items_safety_kit_item_id_fkey" FOREIGN KEY ("safety_kit_item_id") REFERENCES "safety_kit_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_expenses" ADD CONSTRAINT "incident_expenses_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
