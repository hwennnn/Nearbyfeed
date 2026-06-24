import { getPollPreviewStatus } from '@nearbyfeed/shared';
import type { PollWithOptions } from '@/api';

const poll: PollWithOptions = {
  id: 8,
  createdAt: new Date('2026-06-23T08:00:00Z'),
  updatedAt: new Date('2026-06-23T08:00:00Z'),
  postId: 91,
  votingLength: 1,
  participantsCount: 10,
  options: [],
};

describe('mobile poll status', () => {
  it('uses the shared poll lifecycle label used by web previews', () => {
    expect(
      getPollPreviewStatus(
        poll,
        new Date('2026-06-23T09:00:00Z'),
      ),
    ).toEqual({
      statusLabel: 'Closes in 23 hours',
      statusTone: 'live',
    });
  });
});
