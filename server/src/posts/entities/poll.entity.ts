import { type Poll, type PollOption, type PollVote } from '@prisma/client';

export type PollWithOptions = Poll & {
  options: PollOption[];
  vote?: PollVote;
};

export interface VotePollResult {
  vote: PollVote;
  poll: Poll;
  pollOption: PollOption;
}
