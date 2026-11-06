/*
  Warnings:

  - You are about to drop the column `points` on the `activities` table. All the data in the column will be lost.
  - You are about to drop the column `conference_attendance_id` on the `certificates` table. All the data in the column will be lost.
  - You are about to drop the column `residence` on the `doctors` table. All the data in the column will be lost.
  - You are about to drop the column `attendance_id` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the `conference_attendance` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[activity_registration_id]` on the table `certificates` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `specialists` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `activity_president_name` to the `activities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `activity_series_id` to the `activities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `annual_sequence` to the `activities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `capacity` to the `activities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `governorate_id` to the `activities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `activity_registration_id` to the `certificates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `doctor_type` to the `doctors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `governorate_id` to the `doctors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nationality` to the `doctors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `registration_id` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `specialists` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OrganizationRole" AS ENUM ('PRIMARY_SPONSOR', 'EXECUTING_ORGANIZER', 'COLLABORATOR');

-- CreateEnum
CREATE TYPE "Nationality" AS ENUM ('SYRIAN', 'NON_SYRIAN', 'PALESTINIAN');

-- CreateEnum
CREATE TYPE "DoctorType" AS ENUM ('RESIDENT', 'SPECIALIST');

-- DropForeignKey
ALTER TABLE "certificates" DROP CONSTRAINT "certificates_conference_attendance_id_fkey";

-- DropForeignKey
ALTER TABLE "conference_attendance" DROP CONSTRAINT "conference_attendance_activity_id_fkey";

-- DropForeignKey
ALTER TABLE "conference_attendance" DROP CONSTRAINT "conference_attendance_doctor_id_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_attendance_id_fkey";

-- DropIndex
DROP INDEX "certificates_conference_attendance_id_key";

-- DropIndex
DROP INDEX "payments_attendance_id_idx";

-- AlterTable
ALTER TABLE "activities" DROP COLUMN "points",
ADD COLUMN     "activity_president_name" TEXT NOT NULL,
ADD COLUMN     "activity_series_id" BIGINT NOT NULL,
ADD COLUMN     "annual_sequence" INTEGER NOT NULL,
ADD COLUMN     "attendance_cpd_points" DECIMAL(6,2) NOT NULL DEFAULT 0,
ADD COLUMN     "capacity" INTEGER NOT NULL,
ADD COLUMN     "governorate_id" INTEGER NOT NULL,
ADD COLUMN     "min_attendance_percentage" DECIMAL(5,2) NOT NULL DEFAULT 75,
ADD COLUMN     "participation_cpd_points" DECIMAL(6,2) NOT NULL DEFAULT 0,
ADD COLUMN     "registration_fee_syp" DECIMAL(14,2) NOT NULL DEFAULT 0,
ALTER COLUMN "start_at" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "end_at" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "certificates" DROP COLUMN "conference_attendance_id",
ADD COLUMN     "activity_registration_id" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "doctors" DROP COLUMN "residence",
ADD COLUMN     "doctor_type" "DoctorType" NOT NULL,
ADD COLUMN     "governorate_id" INTEGER NOT NULL,
ADD COLUMN     "nationality" "Nationality" NOT NULL,
ADD COLUMN     "palestinian_id" TEXT,
ADD COLUMN     "passport_number" TEXT,
ALTER COLUMN "national_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "attendance_id",
ADD COLUMN     "registration_id" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "specialists" ADD COLUMN     "code" TEXT NOT NULL;

-- DropTable
DROP TABLE "conference_attendance";

-- DropEnum
DROP TYPE "AttendanceStatus";

-- CreateTable
CREATE TABLE "activity_organizations" (
    "id" BIGSERIAL NOT NULL,
    "activity_id" BIGINT NOT NULL,
    "organization_id" BIGINT NOT NULL,
    "role" "OrganizationRole" NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "activity_organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_registrations" (
    "id" BIGSERIAL NOT NULL,
    "doctor_id" BIGINT NOT NULL,
    "activity_id" BIGINT NOT NULL,
    "participation_role" "ParticipationRole" NOT NULL DEFAULT 'ATTENDEE',
    "points_awarded" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_series" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "activity_series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_sessions" (
    "id" BIGSERIAL NOT NULL,
    "activity_id" BIGINT NOT NULL,
    "start_at" TIMESTAMPTZ(3) NOT NULL,
    "end_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificate_settings" (
    "id" INTEGER NOT NULL,
    "organization_name" TEXT NOT NULL,
    "organization_logo_path" TEXT NOT NULL,
    "director_general_name" TEXT NOT NULL,
    "template_path" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificate_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "governorates" (
    "id" SERIAL NOT NULL,
    "name_ar" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,

    CONSTRAINT "governorates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "logo_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_attendances" (
    "id" BIGSERIAL NOT NULL,
    "session_id" BIGINT NOT NULL,
    "registration_id" BIGINT NOT NULL,
    "check_in_at" TIMESTAMPTZ(3) NOT NULL,
    "check_out_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_organizations_organization_id_idx" ON "activity_organizations"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "activity_organizations_activity_id_organization_id_role_key" ON "activity_organizations"("activity_id", "organization_id", "role");

-- CreateIndex
CREATE INDEX "activity_registrations_activity_id_idx" ON "activity_registrations"("activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "activity_registrations_doctor_id_activity_id_key" ON "activity_registrations"("doctor_id", "activity_id");

-- CreateIndex
CREATE INDEX "activity_sessions_activity_id_idx" ON "activity_sessions"("activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "governorates_name_ar_key" ON "governorates"("name_ar");

-- CreateIndex
CREATE UNIQUE INDEX "governorates_name_en_key" ON "governorates"("name_en");

-- CreateIndex
CREATE INDEX "session_attendances_registration_id_idx" ON "session_attendances"("registration_id");

-- CreateIndex
CREATE UNIQUE INDEX "session_attendances_session_id_registration_id_key" ON "session_attendances"("session_id", "registration_id");

-- CreateIndex
CREATE INDEX "activities_activity_series_id_created_at_idx" ON "activities"("activity_series_id", "created_at");

-- CreateIndex
CREATE INDEX "activities_governorate_id_idx" ON "activities"("governorate_id");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_activity_registration_id_key" ON "certificates"("activity_registration_id");

-- CreateIndex
CREATE INDEX "doctors_governorate_id_idx" ON "doctors"("governorate_id");

-- CreateIndex
CREATE INDEX "payments_registration_id_idx" ON "payments"("registration_id");

-- CreateIndex
CREATE UNIQUE INDEX "specialists_code_key" ON "specialists"("code");

-- AddForeignKey
ALTER TABLE "activity_organizations" ADD CONSTRAINT "activity_organizations_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_organizations" ADD CONSTRAINT "activity_organizations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_registrations" ADD CONSTRAINT "activity_registrations_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_registrations" ADD CONSTRAINT "activity_registrations_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_sessions" ADD CONSTRAINT "activity_sessions_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_governorate_id_fkey" FOREIGN KEY ("governorate_id") REFERENCES "governorates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_activity_series_id_fkey" FOREIGN KEY ("activity_series_id") REFERENCES "activity_series"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_activity_registration_id_fkey" FOREIGN KEY ("activity_registration_id") REFERENCES "activity_registrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_governorate_id_fkey" FOREIGN KEY ("governorate_id") REFERENCES "governorates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "activity_registrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_attendances" ADD CONSTRAINT "session_attendances_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "activity_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_attendances" ADD CONSTRAINT "session_attendances_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "activity_registrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Essential concurrency-safe uniqueness rules not represented in the current Prisma schema.
-- Keep validation and business workflows in NestJS.

-- Annual activity number is unique within its series and creation year.
-- created_at is TIMESTAMP WITHOUT TIME ZONE in the current schema.
CREATE UNIQUE INDEX "activities_series_year_sequence_unique"
ON "activities" (
    "activity_series_id",
    (EXTRACT(YEAR FROM "created_at")),
    "annual_sequence"
);

-- At most one primary sponsor and one executing organization per activity.
-- Many collaborators remain allowed.
CREATE UNIQUE INDEX "one_primary_sponsor_per_activity"
ON "activity_organizations" ("activity_id")
WHERE "role" = 'PRIMARY_SPONSOR';

CREATE UNIQUE INDEX "one_executing_organizer_per_activity"
ON "activity_organizations" ("activity_id")
WHERE "role" = 'EXECUTING_ORGANIZER';
