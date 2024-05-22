/*
  Warnings:

  - You are about to drop the `Event` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EventParticipation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_postId_fkey";

-- DropForeignKey
ALTER TABLE "EventParticipation" DROP CONSTRAINT "EventParticipation_eventId_fkey";

-- DropForeignKey
ALTER TABLE "EventParticipation" DROP CONSTRAINT "EventParticipation_userId_fkey";

-- DropTable
DROP TABLE "Event";

-- DropTable
DROP TABLE "EventParticipation";
