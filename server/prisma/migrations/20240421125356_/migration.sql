/*
  Warnings:

  - You are about to drop the column `flagged` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `flagged` on the `Post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "flagged";

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "flagged";
