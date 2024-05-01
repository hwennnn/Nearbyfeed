/*
  Warnings:

  - Added the required column `order` to the `PollOption` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PollOption" ADD COLUMN     "order" INTEGER NOT NULL;
