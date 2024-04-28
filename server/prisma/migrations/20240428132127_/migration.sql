/*
  Warnings:

  - The primary key for the `PollVote` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropIndex
DROP INDEX "PollVote_pollId_userId_key";

-- AlterTable
ALTER TABLE "PollVote" DROP CONSTRAINT "PollVote_pkey",
ADD CONSTRAINT "PollVote_pkey" PRIMARY KEY ("pollId", "userId");
