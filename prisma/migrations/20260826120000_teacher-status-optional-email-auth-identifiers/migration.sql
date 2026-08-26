-- Add TeacherContractType enum
CREATE TYPE "TeacherContractType" AS ENUM ('FONCTIONNAIRE', 'ENF');

-- Change Teacher.contractType to use the new enum
ALTER TABLE "Teacher" ALTER COLUMN "contractType" TYPE "TeacherContractType" USING "contractType"::text::"TeacherContractType";

-- Make User.email optional (allows NULL values)
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

-- Add unique constraint on Teacher.nationalIdNumber per school
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_nationalIdNumber_schoolId_key" UNIQUE ("nationalIdNumber", "schoolId");
