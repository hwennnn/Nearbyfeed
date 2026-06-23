import {
  formatPollVoteCount,
  getPollOptionResults,
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
  voteLabel: string;
};

export const getPollPreviewModel = (
  poll: Poll,
  visibleOptionLimit = 3,
): PollPreviewModel => {
  const participantCount = Math.max(0, poll.participantsCount);
  const options = getPollOptionResults(poll.options, participantCount, {
    limit: visibleOptionLimit,
    sortByVotes: true,
  });

  return {
    hiddenOptionCount: Math.max(0, poll.options.length - visibleOptionLimit),
    leaderLabel: participantCount === 0 ? 'waiting on votes' : 'top pick',
    options: options.map(({ id, isLeader, percentage, text }) => ({
      id,
      isLeader,
      percentage,
      text,
    })),
    voteLabel: formatPollVoteCount(participantCount),
  };
};
