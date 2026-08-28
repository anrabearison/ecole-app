/*
  Warnings:

  - You are about to drop the column `homeroomTeacherId` on the `Classroom` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Classroom" DROP CONSTRAINT "Classroom_homeroomTeacherId_fkey";

-- AlterTable
ALTER TABLE "Classroom" DROP COLUMN "homeroomTeacherId";

-- CreateTable
CREATE TABLE "ClassroomHomeroomTeacher" (
    "id" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "classroomId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassroomHomeroomTeacher_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClassroomHomeroomTeacher_classroomId_idx" ON "ClassroomHomeroomTeacher"("classroomId");

-- CreateIndex
CREATE INDEX "ClassroomHomeroomTeacher_teacherId_idx" ON "ClassroomHomeroomTeacher"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassroomHomeroomTeacher_classroomId_teacherId_key" ON "ClassroomHomeroomTeacher"("classroomId", "teacherId");

-- AddForeignKey
ALTER TABLE "ClassroomHomeroomTeacher" ADD CONSTRAINT "ClassroomHomeroomTeacher_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassroomHomeroomTeacher" ADD CONSTRAINT "ClassroomHomeroomTeacher_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassroomHomeroomTeacher" ADD CONSTRAINT "ClassroomHomeroomTeacher_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
