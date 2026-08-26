-- Add StudentStatus and Sex enums
CREATE TYPE "StudentStatus" AS ENUM ('PASSING', 'REPEATING', 'TRIPLING');
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE');

-- Add administrative fields to Student
ALTER TABLE "Student" ADD COLUMN "registrationNumber" TEXT;
ALTER TABLE "Student" ADD COLUMN "status" "StudentStatus" DEFAULT 'PASSING';
ALTER TABLE "Student" ADD COLUMN "placeOfBirth" TEXT;
ALTER TABLE "Student" ADD COLUMN "sex" "Sex";

-- Add administrative fields to Teacher
ALTER TABLE "Teacher" ADD COLUMN "registrationNumber" TEXT;
ALTER TABLE "Teacher" ADD COLUMN "nationalIdNumber" TEXT;
ALTER TABLE "Teacher" ADD COLUMN "sex" "Sex";

-- Add unique constraint on Student.registrationNumber per school
ALTER TABLE "Student" ADD CONSTRAINT "Student_registrationNumber_schoolId_key" UNIQUE ("registrationNumber", "schoolId");
