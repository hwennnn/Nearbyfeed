-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "locationName" TEXT,
ALTER COLUMN "content" DROP NOT NULL;
