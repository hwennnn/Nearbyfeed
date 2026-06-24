-- Preserve existing report rows while attributing all new authenticated reports.
ALTER TABLE "PostReport" ADD COLUMN "reporterId" INTEGER;
ALTER TABLE "CommentReport" ADD COLUMN "reporterId" INTEGER;

CREATE UNIQUE INDEX "PostReport_postId_reporterId_key" ON "PostReport"("postId", "reporterId");
CREATE UNIQUE INDEX "CommentReport_commentId_reporterId_key" ON "CommentReport"("commentId", "reporterId");

ALTER TABLE "PostReport"
  ADD CONSTRAINT "PostReport_reporterId_fkey"
  FOREIGN KEY ("reporterId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CommentReport"
  ADD CONSTRAINT "CommentReport_reporterId_fkey"
  FOREIGN KEY ("reporterId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
