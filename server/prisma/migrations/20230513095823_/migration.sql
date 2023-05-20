/*
  Warnings:

  - The primary key for the `Updoot` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "Updoot" DROP CONSTRAINT "Updoot_pkey",
ADD CONSTRAINT "Updoot_pkey" PRIMARY KEY ("postId", "userId");
