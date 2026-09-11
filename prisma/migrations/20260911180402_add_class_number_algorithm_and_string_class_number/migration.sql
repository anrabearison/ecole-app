-- CreateEnum
CREATE TYPE "ClassNumberAlgorithm" AS ENUM ('STANDARD', 'GENDER_SEPARATED');

-- AlterTable
ALTER TABLE "Enrollment" ALTER COLUMN "classNumber" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "School" ADD COLUMN     "classNumberAlgorithm" "ClassNumberAlgorithm" NOT NULL DEFAULT 'GENDER_SEPARATED';

-- AlterTable
ALTER TABLE "Student" ALTER COLUMN "classNumber" SET DATA TYPE TEXT;

-- Set all existing classNumber values to NULL for manual reassignment
UPDATE "Enrollment" SET "classNumber" = NULL WHERE "classNumber" IS NOT NULL;
UPDATE "Student" SET "classNumber" = NULL WHERE "classNumber" IS NOT NULL;
