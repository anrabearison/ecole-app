/*
  Warnings:

  - Made the column `registrationNumber` on table `Student` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `Student` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sex` on table `Student` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nationalIdNumber` on table `Teacher` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sex` on table `Teacher` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Student" ALTER COLUMN "registrationNumber" SET NOT NULL,
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "sex" SET NOT NULL;

-- AlterTable
ALTER TABLE "Teacher" ALTER COLUMN "nationalIdNumber" SET NOT NULL,
ALTER COLUMN "sex" SET NOT NULL;

-- CreateTable
CREATE TABLE "SubjectCoefficient" (
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
CREATE INDEX "SubjectCoefficient_subjectId_schoolGradeId_trackId_schoolId_idx" ON "SubjectCoefficient"("subjectId", "schoolGradeId", "trackId", "schoolId");

-- CreateIndex
CREATE INDEX "SubjectCoefficient_schoolGradeId_schoolId_idx" ON "SubjectCoefficient"("schoolGradeId", "schoolId");

-- AddForeignKey
ALTER TABLE "SubjectCoefficient" ADD CONSTRAINT "SubjectCoefficient_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectCoefficient" ADD CONSTRAINT "SubjectCoefficient_schoolGradeId_fkey" FOREIGN KEY ("schoolGradeId") REFERENCES "SchoolGrade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectCoefficient" ADD CONSTRAINT "SubjectCoefficient_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectCoefficient" ADD CONSTRAINT "SubjectCoefficient_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
