import { MessageCircle } from 'lucide-react';
import { type Comment, type CommentSort } from '../../types';
import { CommentRow } from './CommentRow';
import { CommentSortControl } from './CommentSortControl';
import { getCommentSortLabel } from './details-presentation';

export const CommentList = ({
  canBlockComment,
  commentSort,
  comments,
  onCommentSortChange,
  onBlockComment,
  onReportComment,
}: {
  canBlockComment?: (comment: Comment) => boolean;
  commentSort: CommentSort;
  comments: Comment[];
  onCommentSortChange: (sort: CommentSort) => void;
  onBlockComment?: (comment: Comment) => void;
  onReportComment?: (comment: Comment) => void;
}) => {
  if (comments.length === 0) {
    return (
      <div className="comments-empty-state">
        <MessageCircle />
        <strong>No comments yet</strong>
        <span>Be first with the local context.</span>
      </div>
    );
  }

  return (
    <div className="comments-stack">
      <div className="comments-stack-head">
        <div className="comments-stack-summary">
          <span>Local replies</span>
          <strong>{comments.length}</strong>
          <em>{getCommentSortLabel(commentSort)} first</em>
        </div>
        <CommentSortControl
          onChange={onCommentSortChange}
          value={commentSort}
        />
      </div>
      {comments.map((item) => (
        <CommentRow
          canBlock={canBlockComment?.(item) ?? false}
          comment={item}
          key={item.id}
          onBlock={onBlockComment}
          onReport={onReportComment}
        />
      ))}
    </div>
  );
};
