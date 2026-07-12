/*
  Warnings:

  - Added the required column `periodId` to the `Grade` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Add optional periodId column first
ALTER TABLE "Grade" ADD COLUMN "periodId" TEXT;

-- Step 2: Add new columns to School and Subject
ALTER TABLE "School" ADD COLUMN "dailyWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.4,
ADD COLUMN "examWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.6;

ALTER TABLE "Subject" ADD COLUMN "coefficient" DOUBLE PRECISION NOT NULL DEFAULT 1.0;

-- Step 3: Create Period table
CREATE TABLE "Period" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "schoolYear" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "Period_pkey" PRIMARY KEY ("id")
);

-- Step 4: Create index for Period
CREATE UNIQUE INDEX "Period_name_schoolYear_schoolId_key" ON "Period"("name", "schoolYear", "schoolId");

-- Step 5: Add foreign key for Period
ALTER TABLE "Period" ADD CONSTRAINT "Period_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 6: Create a default period for each school and update existing grades
-- This handles existing test data by assigning them to a default period
DO $$
DECLARE
    school_record RECORD;
    default_period_id TEXT;
BEGIN
    FOR school_record IN SELECT id FROM "School" LOOP
        -- Create a default period for this school
        INSERT INTO "Period" (id, name, "order", "schoolYear", "schoolId")
        VALUES (
            gen_random_uuid()::text,
            'Période par défaut',
            1,
            '2025-2026',
            school_record.id
        )
        RETURNING id INTO default_period_id;
        
        -- Update existing grades for this school
        UPDATE "Grade"
        SET "periodId" = default_period_id
        WHERE "schoolId" = school_record.id AND "periodId" IS NULL;
    END LOOP;
END $$;

-- Step 7: Make periodId required after all existing grades have a periodId
ALTER TABLE "Grade" ALTER COLUMN "periodId" SET NOT NULL;

-- Step 8: Add foreign key for Grade.periodId
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
