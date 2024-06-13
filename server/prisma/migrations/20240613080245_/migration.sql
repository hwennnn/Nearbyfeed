/*
  Warnings:

  - Changed the type of `providerName` on the `Provider` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ProviderType" AS ENUM ('EMAIL', 'GOOGLE', 'APPLE');

-- AlterTable
ALTER TABLE "Provider" DROP COLUMN "providerName",
ADD COLUMN     "providerName" "ProviderType" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Provider_providerName_userId_key" ON "Provider"("providerName", "userId");
