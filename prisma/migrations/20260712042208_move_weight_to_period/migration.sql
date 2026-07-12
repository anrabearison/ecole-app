/*
  Warnings:

  - You are about to drop the column `dailyWeight` on the `School` table. All the data in the column will be lost.
  - You are about to drop the column `examWeight` on the `School` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Period" ADD COLUMN     "dailyWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.4,
ADD COLUMN     "examWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.6;

-- AlterTable
ALTER TABLE "School" DROP COLUMN "dailyWeight",
DROP COLUMN "examWeight";
