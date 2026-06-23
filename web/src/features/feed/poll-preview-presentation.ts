import { formatSingularPlural } from '@nearbyfeed/shared';
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

const getPercentage = (voteCount: number, participantsCount: number): number => {
  if (participantsCount <= 0) return 0;
  return Math.min(100, Math.round((voteCount / participantsCount) * 100));
};

export const getPollPreviewModel = (
  poll: Poll,
  visibleOptionLimit = 3,
): PollPreviewModel => {
  const participantCount = Math.max(0, poll.participantsCount);
  const orderedOptions = [...poll.options].sort((a, b) => {
    const voteDiff = b.voteCount - a.voteCount;
    return voteDiff === 0 ? a.order - b.order : voteDiff;
  });
  const leaderVoteCount = orderedOptions[0]?.voteCount ?? 0;

  return {
    hiddenOptionCount: Math.max(0, poll.options.length - visibleOptionLimit),
    leaderLabel: participantCount === 0 ? 'waiting on votes' : 'top pick',
    options: orderedOptions.slice(0, visibleOptionLimit).map((option) => ({
      id: option.id,
      isLeader: participantCount > 0 && option.voteCount === leaderVoteCount,
      percentage: getPercentage(option.voteCount, participantCount),
      text: option.text,
    })),
    voteLabel: formatSingularPlural({
      empty: '0 votes',
      plural: 'votes',
      singular: 'vote',
      value: participantCount,
    }),
  };
};
