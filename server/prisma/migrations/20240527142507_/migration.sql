/*
  Warnings:

  - The primary key for the `Provider` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Provider` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Provider" DROP CONSTRAINT "Provider_pkey",
DROP COLUMN "id";
