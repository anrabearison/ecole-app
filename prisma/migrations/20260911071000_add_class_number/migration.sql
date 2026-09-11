-- AddColumn classNumber to Student
ALTER TABLE "public"."Student" ADD COLUMN IF NOT EXISTS "classNumber" INTEGER;

-- AddColumn classNumber to Enrollment
ALTER TABLE "public"."Enrollment" ADD COLUMN IF NOT EXISTS "classNumber" INTEGER;

-- AddUniqueConstraint on Enrollment (classroomId, classNumber)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Enrollment_classroomId_classNumber_key'
  ) THEN
    ALTER TABLE "public"."Enrollment"
      ADD CONSTRAINT "Enrollment_classroomId_classNumber_key"
      UNIQUE ("classroomId", "classNumber");
  END IF;
END $$;
