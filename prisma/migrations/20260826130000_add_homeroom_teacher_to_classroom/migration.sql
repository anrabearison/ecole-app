-- AlterTable
ALTER TABLE "Classroom" ADD COLUMN IF NOT EXISTS "homeroomTeacherId" TEXT;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Classroom_homeroomTeacherId_fkey'
  ) THEN
    ALTER TABLE "Classroom" ADD CONSTRAINT "Classroom_homeroomTeacherId_fkey" FOREIGN KEY ("homeroomTeacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
