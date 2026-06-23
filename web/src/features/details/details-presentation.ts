import {
  COMMENT_SORT_OPTIONS as SHARED_COMMENT_SORT_OPTIONS,
  DEFAULT_COMMENT_SORT,
} from '@nearbyfeed/shared';
import { timeAgo } from '../../lib/format';
import { type Comment, type CommentSort, type Post } from '../../types';

export type ThreadEnergy = 'quiet' | 'warming' | 'active' | 'surging';

export type ThreadMetrics = {
  commentLabel: string;
  energy: ThreadEnergy;
  energyLabel: string;
  latestLabel: string;
  participantCount: number;
  pollLabel: string;
  score: number;
  voiceLabel: string;
};

export const COMMENT_SORT_OPTIONS = SHARED_COMMENT_SORT_OPTIONS;

export const getCommentSortLabel = (sort: CommentSort): string =>
  COMMENT_SORT_OPTIONS.find((option) => option.value === sort)?.label ??
  COMMENT_SORT_OPTIONS.find((option) => option.value === DEFAULT_COMMENT_SORT)
    ?.label ??
  'Top';

const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

const formatLatestLabel = (value: string): string => {
  const label = timeAgo(value);
  return label === 'Just now' ? 'Latest Just now' : `Latest ${label} ago`;
};

const getParticipants = (post: Post, comments: Comment[]) => {
  const participantIds = new Set<number>();
  const participantNames = new Set<string>();

  if (post.authorId !== undefined) participantIds.add(post.authorId);
  if (post.author?.username !== undefined) participantNames.add(post.author.username);

  comments.forEach((comment) => {
    if (comment.author?.id !== undefined) participantIds.add(comment.author.id);
    if (comment.author?.username !== undefined) {
      participantNames.add(comment.author.username);
    }
  });

  return Math.max(participantIds.size, participantNames.size);
};

export const getThreadMetrics = (
  post: Post,
  comments: Comment[],
): ThreadMetrics => {
  const visibleComments = Math.max(post.commentsCount, comments.length);
  const pollVotes = post.poll?.participantsCount ?? 0;
  const participantCount = getParticipants(post, comments);
  const score = Math.max(0, post.points) * 2 + visibleComments * 8 + pollVotes;

  let energy: ThreadEnergy = 'quiet';
  if (score >= 80) energy = 'surging';
  else if (score >= 36) energy = 'active';
  else if (score >= 8) energy = 'warming';

  const energyLabel =
    energy === 'surging'
      ? 'thread surging'
      : energy === 'active'
        ? 'people are in it'
        : energy === 'warming'
          ? 'warming up'
          : 'quiet thread';

  const latestComment = [...comments].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0];

  return {
    commentLabel: pluralize(visibleComments, 'reply', 'replies'),
    energy,
    energyLabel,
    latestLabel:
      latestComment === undefined
        ? 'No replies yet'
        : formatLatestLabel(latestComment.createdAt),
    participantCount,
    pollLabel:
      post.poll === null || post.poll === undefined
        ? 'No poll'
        : pluralize(pollVotes, 'vote'),
    score,
    voiceLabel: pluralize(participantCount, 'nearby voice'),
  };
};

export const getCommentSignalLabel = (comment: Comment): string => {
  if (comment.points >= 10) return 'top local take';
  if (comment.points > 0) return `${comment.points} up`;
  return 'fresh reply';
};
