-- CreateEnum
CREATE TYPE "DeliberationDecision" AS ENUM ('PROMOTED', 'REPEATED');

-- AlterTable
ALTER TABLE "Classroom" ADD COLUMN     "passingThreshold" DOUBLE PRECISION NOT NULL DEFAULT 10;

-- CreateTable
CREATE TABLE "Deliberation" (
    "id" TEXT NOT NULL,
    "schoolYear" TEXT NOT NULL,
    "studentAverage" DOUBLE PRECISION NOT NULL,
    "decision" "DeliberationDecision" NOT NULL,
    "observations" TEXT,
    "studentId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deliberation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Deliberation_studentId_schoolYear_key" ON "Deliberation"("studentId", "schoolYear");

-- AddForeignKey
ALTER TABLE "Deliberation" ADD CONSTRAINT "Deliberation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deliberation" ADD CONSTRAINT "Deliberation_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
