-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('REGISTERED', 'ATTENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ParticipationRole" AS ENUM ('ATTENDEE', 'PARTICIPANT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPERVISOR', 'ADMIN', 'DOCTOR');

-- CreateTable
CREATE TABLE "activity_form_configs" (
    "id" BIGSERIAL NOT NULL,
    "supervisor_id" BIGINT NOT NULL,
    "form_name" TEXT NOT NULL,
    "fields_schema" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_form_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "activity_type" TEXT NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "description" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "specialist_id" BIGINT NOT NULL,
    "form_config_id" BIGINT NOT NULL,
    "custom_fields" JSONB NOT NULL,
    "form_schema_snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" BIGSERIAL NOT NULL,
    "conference_attendance_id" BIGINT NOT NULL,
    "certificate_number" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "issued_at" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conference_attendance" (
    "id" BIGSERIAL NOT NULL,
    "doctor_id" BIGINT NOT NULL,
    "activity_id" BIGINT NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'REGISTERED',
    "participation_role" "ParticipationRole" NOT NULL DEFAULT 'ATTENDEE',
    "points_awarded" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "attended_at" TIMESTAMP(3),

    CONSTRAINT "conference_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctors" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "specialist_id" BIGINT NOT NULL,
    "national_id" TEXT NOT NULL,
    "residence" TEXT NOT NULL,
    "clinic_address" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "certificate_issued_at" DATE NOT NULL,
    "certificate_number" TEXT NOT NULL,
    "father_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" BIGSERIAL NOT NULL,
    "attendance_id" BIGINT NOT NULL,
    "provider" VARCHAR(30) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "merchant_reference" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "specialists" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "specialists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'DOCTOR',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "certificates_conference_attendance_id_key" ON "certificates"("conference_attendance_id");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_certificate_number_key" ON "certificates"("certificate_number");

-- CreateIndex
CREATE UNIQUE INDEX "conference_attendance_doctor_id_activity_id_key" ON "conference_attendance"("doctor_id", "activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "doctors_user_id_key" ON "doctors"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "doctors_national_id_key" ON "doctors"("national_id");

-- CreateIndex
CREATE INDEX "doctors_specialist_id_idx" ON "doctors"("specialist_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_merchant_reference_key" ON "payments"("merchant_reference");

-- CreateIndex
CREATE INDEX "payments_attendance_id_idx" ON "payments"("attendance_id");

-- CreateIndex
CREATE UNIQUE INDEX "specialists_name_key" ON "specialists"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "activity_form_configs" ADD CONSTRAINT "activity_form_configs_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_specialist_id_fkey" FOREIGN KEY ("specialist_id") REFERENCES "specialists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_form_config_id_fkey" FOREIGN KEY ("form_config_id") REFERENCES "activity_form_configs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_conference_attendance_id_fkey" FOREIGN KEY ("conference_attendance_id") REFERENCES "conference_attendance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conference_attendance" ADD CONSTRAINT "conference_attendance_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conference_attendance" ADD CONSTRAINT "conference_attendance_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_specialist_id_fkey" FOREIGN KEY ("specialist_id") REFERENCES "specialists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_attendance_id_fkey" FOREIGN KEY ("attendance_id") REFERENCES "conference_attendance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Database Constraints
-- Prevent negative activity points
ALTER TABLE "activities"
ADD CONSTRAINT "activities_points_non_negative"
CHECK ("points" >= 0);

-- Prevent negative awarded points
ALTER TABLE "conference_attendance"
ADD CONSTRAINT "attendance_points_non_negative"
CHECK ("points_awarded" >= 0);

-- Require positive payment amounts
ALTER TABLE "payments"
ADD CONSTRAINT "payments_amount_positive"
CHECK ("amount" > 0);

-- Ensure activity ends after it starts
ALTER TABLE "activities"
ADD CONSTRAINT "activities_valid_dates"
CHECK ("end_at" > "start_at");
