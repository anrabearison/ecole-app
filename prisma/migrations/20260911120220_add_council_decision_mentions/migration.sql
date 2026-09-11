-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DeliberationDecision" ADD VALUE 'EXCELLENT';
ALTER TYPE "DeliberationDecision" ADD VALUE 'HONOR_ROLL';
ALTER TYPE "DeliberationDecision" ADD VALUE 'ENCOURAGEMENT';
ALTER TYPE "DeliberationDecision" ADD VALUE 'INSUFFICIENT';
ALTER TYPE "DeliberationDecision" ADD VALUE 'WARNING';
ALTER TYPE "DeliberationDecision" ADD VALUE 'BLAME';
