-- CreateTable
CREATE TABLE "DailyGradeSelection" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyGradeSelection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyGradeSelection_teacherId_classroomId_subjectId_periodI_idx" ON "DailyGradeSelection"("teacherId", "classroomId", "subjectId", "periodId");

-- CreateIndex
CREATE INDEX "DailyGradeSelection_classroomId_periodId_idx" ON "DailyGradeSelection"("classroomId", "periodId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyGradeSelection_teacherId_classroomId_subjectId_periodI_key" ON "DailyGradeSelection"("teacherId", "classroomId", "subjectId", "periodId", "assessmentId");

-- AddForeignKey
ALTER TABLE "DailyGradeSelection" ADD CONSTRAINT "DailyGradeSelection_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyGradeSelection" ADD CONSTRAINT "DailyGradeSelection_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyGradeSelection" ADD CONSTRAINT "DailyGradeSelection_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyGradeSelection" ADD CONSTRAINT "DailyGradeSelection_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyGradeSelection" ADD CONSTRAINT "DailyGradeSelection_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyGradeSelection" ADD CONSTRAINT "DailyGradeSelection_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
