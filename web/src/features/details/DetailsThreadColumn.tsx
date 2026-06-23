import { type Comment, type CommentSort, type Post, type Session } from '../../types';
import { FeedCard } from '../feed/FeedCard';
import { CommentComposer } from './CommentComposer';
import { CommentList } from './CommentList';
import { DetailsNotices } from './DetailsNotices';

export const DetailsThreadColumn = ({
  blockNotice,
  canBlockComment,
  comment,
  commentSort,
  comments,
  detailPost,
  isPostingComment,
  onBlockComment,
  onBlockPost,
  onCommentChange,
  onCommentSortChange,
  onReportComment,
  onReportPost,
  onRequireAuth,
  onSubmitComment,
  reportNotice,
  session,
}: {
  blockNotice: string | null;
  canBlockComment: (comment: Comment) => boolean;
  comment: string;
  commentSort: CommentSort;
  comments: Comment[];
  detailPost: Post;
  isPostingComment: boolean;
  onBlockComment: (comment: Comment) => void;
  onBlockPost?: () => void;
  onCommentChange: (value: string) => void;
  onCommentSortChange: (sort: CommentSort) => void;
  onReportComment: (comment: Comment) => void;
  onReportPost: () => void;
  onRequireAuth: () => void;
  onSubmitComment: () => void;
  reportNotice: string | null;
  session: Session | null;
}) => (
  <div className="details-main-column">
    <DetailsNotices blockNotice={blockNotice} reportNotice={reportNotice} />
    <FeedCard
      onBlock={onBlockPost}
      onOpen={() => undefined}
      onRequireAuth={onRequireAuth}
      onReport={onReportPost}
      post={detailPost}
      session={session}
    />
    <CommentList
      canBlockComment={canBlockComment}
      commentSort={commentSort}
      comments={comments}
      onBlockComment={onBlockComment}
      onCommentSortChange={onCommentSortChange}
      onReportComment={onReportComment}
    />
    <CommentComposer
      comment={comment}
      isPosting={isPostingComment}
      onCommentChange={onCommentChange}
      onSignIn={onRequireAuth}
      onSubmit={onSubmitComment}
      signedIn={session !== null}
    />
  </div>
);
