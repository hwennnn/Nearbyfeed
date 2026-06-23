import { getPollOptionResults } from '@nearbyfeed/shared';
import type { PollWithOptions } from '@/api';

export const getMobilePollResults = (poll: PollWithOptions) =>
  getPollOptionResults(poll.options, poll.participantsCount);
