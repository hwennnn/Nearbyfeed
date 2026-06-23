import type { PollWithOptions } from '@/api';
import { getMobilePollResults } from './poll-results';

const poll: PollWithOptions = {
  id: 8,
  createdAt: new Date('2026-06-23T08:00:00Z'),
  updatedAt: new Date('2026-06-23T08:00:00Z'),
  postId: 91,
  votingLength: 5,
  participantsCount: 10,
  options: [
    {
      id: 1,
      createdAt: new Date('2026-06-23T08:00:00Z'),
      updatedAt: new Date('2026-06-23T08:00:00Z'),
      order: 0,
      pollId: 8,
      text: 'pull up',
      voteCount: 7,
    },
    {
      id: 2,
      createdAt: new Date('2026-06-23T08:00:00Z'),
      updatedAt: new Date('2026-06-23T08:00:00Z'),
      order: 1,
      pollId: 8,
      text: 'skip it',
      voteCount: 3,
    },
  ],
};

describe('mobile poll results', () => {
  it('uses shared poll result math while preserving mobile option order', () => {
    expect(getMobilePollResults(poll)).toEqual([
      expect.objectContaining({
        id: 1,
        isLeader: true,
        percentage: 70,
      }),
      expect.objectContaining({
        id: 2,
        isLeader: false,
        percentage: 30,
      }),
    ]);
  });
});
