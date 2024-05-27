-- AlterTable
ALTER TABLE "Provider" ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Provider_pkey" PRIMARY KEY ("id");
