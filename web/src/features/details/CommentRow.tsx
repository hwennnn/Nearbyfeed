import { timeAgo } from '../../lib/format';
import { Avatar } from '../../components/Avatar';
import { type Comment } from '../../types';
import { BlockUserActionButton } from '../moderation/BlockUserActionButton';
import { ReportActionButton } from '../moderation/ReportActionButton';
import { getCommentSignalLabel } from './details-presentation';

export const CommentRow = ({
  canBlock = false,
  comment,
  onBlock,
  onReport,
}: {
  canBlock?: boolean;
  comment: Comment;
  onBlock?: (comment: Comment) => void;
  onReport?: (comment: Comment) => void;
}) => (
  <div className="comment-row">
    <Avatar image={comment.author?.image} name={comment.author?.username} />
    <div className="comment-row-body">
      <span className="comment-row-meta">
        <strong>{comment.author?.username ?? 'nearby'}</strong>
        <em>{timeAgo(comment.createdAt)}</em>
        <mark>{getCommentSignalLabel(comment)}</mark>
      </span>
      <p>{comment.content}</p>
    </div>
    {((canBlock && onBlock !== undefined) || onReport !== undefined) && (
      <div className="comment-trust-actions">
        {canBlock && onBlock !== undefined && (
          <BlockUserActionButton
            compact
            label="Mute commenter"
            onClick={() => onBlock(comment)}
          />
        )}
        {onReport !== undefined && (
          <ReportActionButton
            compact
            label="Report comment"
            onClick={() => onReport(comment)}
          />
        )}
      </div>
    )}
  </div>
);
