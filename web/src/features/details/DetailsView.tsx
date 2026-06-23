import { type View } from '../../app-types';
import { type Post, type Session } from '../../types';
import { DetailsModerationDialogs } from './DetailsModerationDialogs';
import { DetailsPulseHeader } from './DetailsPulseHeader';
import { DetailsPulseRail } from './DetailsPulseRail';
import { DetailsThreadColumn } from './DetailsThreadColumn';
import { useDetailsViewModel } from './useDetailsViewModel';

export const DetailsView = ({
  backLabel,
  onBack,
  post,
  session,
  setView,
}: {
  backLabel: string;
  onBack: () => void;
  post: Post;
  session: Session | null;
  setView: (view: View) => void;
}) => {
  const details = useDetailsViewModel({ post, session, setView });

  return (
    <section className="details-screen">
      <DetailsPulseHeader
        backLabel={backLabel}
        comments={details.comments}
        onBack={onBack}
        onReportPost={details.onReportPost}
        post={details.detailPost}
      />
      <DetailsThreadColumn
        blockNotice={details.blockNotice}
        canBlockComment={details.canBlockComment}
        comment={details.comment}
        commentSort={details.commentSort}
        comments={details.comments}
        detailPost={details.detailPost}
        isPostingComment={details.isPostingComment}
        onBlockComment={details.onBlockComment}
        onBlockPost={details.onBlockPost}
        onCommentChange={details.onCommentChange}
        onCommentSortChange={details.onCommentSortChange}
        onReportComment={details.onReportComment}
        onReportPost={details.onReportPost}
        onRequireAuth={details.requireAuth}
        onSubmitComment={details.onSubmitComment}
        reportNotice={details.reportNotice}
        session={session}
      />
      <DetailsPulseRail comments={details.comments} post={details.detailPost} />
      <DetailsModerationDialogs
        blockErrorMessage={details.blockErrorMessage}
        blockTarget={details.blockTarget}
        isBlocking={details.isBlocking}
        isReporting={details.isReporting}
        onBlockSignIn={() => {
          details.closeBlockDialog();
          details.requireAuth();
        }}
        onCloseBlock={details.closeBlockDialog}
        onCloseReport={details.closeReportDialog}
        onConfirmBlock={details.confirmBlock}
        onReportSignIn={() => {
          details.closeReportDialog();
          details.requireAuth();
        }}
        onSubmitReport={details.submitReport}
        reportErrorMessage={details.reportErrorMessage}
        reportTarget={details.reportTarget}
        signedIn={details.signedIn}
      />
    </section>
  );
};
