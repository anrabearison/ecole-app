-- CreateEnum
CREATE TYPE "SubjectLanguage" AS ENUM ('FRENCH', 'ENGLISH', 'MALAGASY', 'SPANISH', 'GERMAN');

-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "language" "SubjectLanguage" NOT NULL DEFAULT 'FRENCH';

-- Update existing subjects based on their names
UPDATE "Subject" SET "language" = 'ENGLISH' WHERE LOWER("name") LIKE '%anglais%';
UPDATE "Subject" SET "language" = 'MALAGASY' WHERE LOWER("name") LIKE '%malagasy%';
UPDATE "Subject" SET "language" = 'SPANISH' WHERE LOWER("name") LIKE '%espagnol%';
UPDATE "Subject" SET "language" = 'GERMAN' WHERE LOWER("name") LIKE '%allemand%';
UPDATE "Subject" SET "language" = 'FRENCH' WHERE LOWER("name") LIKE '%français%';
