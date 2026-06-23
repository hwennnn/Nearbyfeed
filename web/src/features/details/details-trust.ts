import { type Comment, type Post, type Session } from '../../types';
import { type BlockUserTarget } from '../moderation/block-types';
import { type ReportDialogTarget } from '../moderation/report-types';

export const getPostReportTarget = (post: Post): ReportDialogTarget => ({
  id: post.id,
  kind: 'post',
  preview: post.title,
});

export const getCommentReportTarget = (
  comment: Comment,
): ReportDialogTarget => ({
  id: comment.id,
  kind: 'comment',
  preview: comment.content,
});

export const getPostBlockTarget = (
  post: Post,
  session: Session | null,
): BlockUserTarget | null => {
  const userId = post.author?.id ?? post.authorId;
  if (userId === undefined || userId === session?.user.id) return null;

  return {
    kind: 'post',
    preview: post.title,
    userId,
    username: post.author?.username ?? 'nearby',
  };
};

export const getCommentBlockTarget = (
  comment: Comment,
  session: Session | null,
): BlockUserTarget | null => {
  const userId = comment.author?.id;
  if (userId === undefined || userId === session?.user.id) return null;

  return {
    kind: 'comment',
    preview: comment.content,
    userId,
    username: comment.author?.username ?? 'nearby',
  };
};
