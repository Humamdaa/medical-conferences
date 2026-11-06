-- DropForeignKey
ALTER TABLE "doctors" DROP CONSTRAINT "doctors_governorate_id_fkey";

-- DropForeignKey
ALTER TABLE "doctors" DROP CONSTRAINT "doctors_specialist_id_fkey";

-- AlterTable
ALTER TABLE "doctors" ALTER COLUMN "specialist_id" DROP NOT NULL,
ALTER COLUMN "clinic_address" DROP NOT NULL,
ALTER COLUMN "phone_number" DROP NOT NULL,
ALTER COLUMN "certificate_issued_at" DROP NOT NULL,
ALTER COLUMN "certificate_number" DROP NOT NULL,
ALTER COLUMN "father_name" DROP NOT NULL,
ALTER COLUMN "doctor_type" DROP NOT NULL,
ALTER COLUMN "governorate_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_specialist_id_fkey" FOREIGN KEY ("specialist_id") REFERENCES "specialists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_governorate_id_fkey" FOREIGN KEY ("governorate_id") REFERENCES "governorates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
