/*
  Warnings:

  - You are about to drop the column `participants` on the `Poll` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Poll" DROP COLUMN "participants",
ADD COLUMN     "participantsCount" INTEGER NOT NULL DEFAULT 0;
