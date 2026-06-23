import {
  formatPollVoteCount,
  formatRelativeFullTime,
  getPollExpirationDate,
  getPollOptionResults,
  isPollExpired,
} from '@nearbyfeed/shared';
import { type Post } from '../../types';

type Poll = NonNullable<Post['poll']>;

export type PollPreviewOption = {
  id: number;
  isLeader: boolean;
  percentage: number;
  text: string;
};

export type PollPreviewModel = {
  hiddenOptionCount: number;
  leaderLabel: string;
  options: PollPreviewOption[];
  statusLabel: string;
  statusTone: 'live' | 'closing' | 'closed' | 'voted';
  totalOptionLabel: string;
  voteLabel: string;
};

const CLOSING_SOON_MS = 6 * 60 * 60 * 1000;

const getPollStatus = (
  poll: Poll,
  now: Date,
): Pick<PollPreviewModel, 'statusLabel' | 'statusTone'> => {
  if (poll.vote !== undefined && poll.vote !== null) {
    return {
      statusLabel: 'You voted',
      statusTone: 'voted',
    };
  }

  if (poll.createdAt === undefined) {
    return {
      statusLabel: 'Vote from details',
      statusTone: 'live',
    };
  }

  const expiresAt = getPollExpirationDate(poll.createdAt, poll.votingLength);
  const expiresAtMs = expiresAt.getTime();

  if (!Number.isFinite(expiresAtMs)) {
    return {
      statusLabel: 'Vote from details',
      statusTone: 'live',
    };
  }

  const remainingMs = expiresAtMs - now.getTime();
  if (isPollExpired(poll.createdAt, poll.votingLength, now)) {
    return {
      statusLabel: 'Closed',
      statusTone: 'closed',
    };
  }

  return {
    statusLabel: `Closes in ${formatRelativeFullTime(expiresAt, now)}`,
    statusTone: remainingMs <= CLOSING_SOON_MS ? 'closing' : 'live',
  };
};

export const getPollPreviewModel = (
  poll: Poll,
  visibleOptionLimit = 3,
  now = new Date(Date.now()),
): PollPreviewModel => {
  const participantCount = Math.max(0, poll.participantsCount);
  const options = getPollOptionResults(poll.options, participantCount, {
    limit: visibleOptionLimit,
    sortByVotes: true,
  });
  const status = getPollStatus(poll, now);

  return {
    hiddenOptionCount: Math.max(0, poll.options.length - visibleOptionLimit),
    leaderLabel: participantCount === 0 ? 'waiting on votes' : 'top pick',
    options: options.map(({ id, isLeader, percentage, text }) => ({
      id,
      isLeader,
      percentage,
      text,
    })),
    ...status,
    totalOptionLabel: `${poll.options.length} ${
      poll.options.length === 1 ? 'choice' : 'choices'
    }`,
    voteLabel: formatPollVoteCount(participantCount),
  };
};
