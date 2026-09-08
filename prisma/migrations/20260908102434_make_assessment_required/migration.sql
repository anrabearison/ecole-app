/*
  Warnings:

  - You are about to drop the column `_legacy_comment` on the `Grade` table. All the data in the column will be lost.
  - You are about to drop the column `classroomId` on the `Grade` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Grade` table. All the data in the column will be lost.
  - You are about to drop the column `periodId` on the `Grade` table. All the data in the column will be lost.
  - You are about to drop the column `schoolId` on the `Grade` table. All the data in the column will be lost.
  - You are about to drop the column `subjectId` on the `Grade` table. All the data in the column will be lost.
  - You are about to drop the column `teacherId` on the `Grade` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Grade` table. All the data in the column will be lost.
  - Made the column `assessmentId` on table `Grade` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Grade" DROP CONSTRAINT "Grade_classroomId_fkey";

-- DropForeignKey
ALTER TABLE "Grade" DROP CONSTRAINT "Grade_periodId_fkey";

-- DropForeignKey
ALTER TABLE "Grade" DROP CONSTRAINT "Grade_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "Grade" DROP CONSTRAINT "Grade_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "Grade" DROP CONSTRAINT "Grade_teacherId_fkey";

-- AlterTable
ALTER TABLE "Grade" DROP COLUMN "_legacy_comment",
DROP COLUMN "classroomId",
DROP COLUMN "date",
DROP COLUMN "periodId",
DROP COLUMN "schoolId",
DROP COLUMN "subjectId",
DROP COLUMN "teacherId",
DROP COLUMN "type",
ALTER COLUMN "assessmentId" SET NOT NULL;
