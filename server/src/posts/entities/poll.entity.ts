import { type Poll, type PollOption, type PollVote } from '@prisma/client';

export type PollWithOptions = Poll & {
  options: PollOption[];
  vote?: PollVote;
};
