/*
  Warnings:

  - You are about to drop the column `room` on the `ScheduleSlot` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ScheduleSlot" DROP COLUMN "room",
ADD COLUMN     "roomId" TEXT;

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Room_name_schoolId_key" ON "Room"("name", "schoolId");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleSlot" ADD CONSTRAINT "ScheduleSlot_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;
