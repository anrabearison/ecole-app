-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "guardianName" TEXT,
ADD COLUMN     "guardianPhone" TEXT;

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "contractType" TEXT,
ADD COLUMN     "phone" TEXT;
