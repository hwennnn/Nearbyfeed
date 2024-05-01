/*
  Warnings:

  - A unique constraint covering the columns `[postId]` on the table `Poll` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Poll_postId_key" ON "Poll"("postId");
