/*
  Safe Migration with Data Backfill:
  Populates existing NULL values in Student and Teacher tables before enforcing NOT NULL constraints.
  Uses guaranteed unique ID concatenation to respect @@unique([registrationNumber, schoolId]).
*/

-- Backfill NULL values in Student table
UPDATE "Student" SET "registrationNumber" = CONCAT('MAT-', "id") WHERE "registrationNumber" IS NULL;
UPDATE "Student" SET "status" = 'PASSING'::"StudentStatus" WHERE "status" IS NULL;
UPDATE "Student" SET "sex" = 'MALE'::"Sex" WHERE "sex" IS NULL;

-- Backfill NULL values in Teacher table
UPDATE "Teacher" SET "nationalIdNumber" = CONCAT('CIN-', "id") WHERE "nationalIdNumber" IS NULL;
UPDATE "Teacher" SET "sex" = 'MALE'::"Sex" WHERE "sex" IS NULL;

-- AlterTable Student
ALTER TABLE "Student" ALTER COLUMN "registrationNumber" SET NOT NULL,
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "sex" SET NOT NULL;

-- AlterTable Teacher
ALTER TABLE "Teacher" ALTER COLUMN "nationalIdNumber" SET NOT NULL,
ALTER COLUMN "sex" SET NOT NULL;

-- CreateTable SubjectCoefficient
CREATE TABLE IF NOT EXISTS "SubjectCoefficient" (
    "id" TEXT NOT NULL,
    "coefficient" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "subjectId" TEXT NOT NULL,
    "schoolGradeId" TEXT NOT NULL,
    "trackId" TEXT,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubjectCoefficient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SubjectCoefficient_subjectId_schoolGradeId_trackId_schoolId_idx" ON "SubjectCoefficient"("subjectId", "schoolGradeId", "trackId", "schoolId");
CREATE INDEX IF NOT EXISTS "SubjectCoefficient_schoolGradeId_schoolId_idx" ON "SubjectCoefficient"("schoolGradeId", "schoolId");

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SubjectCoefficient_subjectId_fkey') THEN
    ALTER TABLE "SubjectCoefficient" ADD CONSTRAINT "SubjectCoefficient_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SubjectCoefficient_schoolGradeId_fkey') THEN
    ALTER TABLE "SubjectCoefficient" ADD CONSTRAINT "SubjectCoefficient_schoolGradeId_fkey" FOREIGN KEY ("schoolGradeId") REFERENCES "SchoolGrade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SubjectCoefficient_trackId_fkey') THEN
    ALTER TABLE "SubjectCoefficient" ADD CONSTRAINT "SubjectCoefficient_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SubjectCoefficient_schoolId_fkey') THEN
    ALTER TABLE "SubjectCoefficient" ADD CONSTRAINT "SubjectCoefficient_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
