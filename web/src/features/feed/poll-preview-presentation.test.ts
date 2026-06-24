import {
  getPollExpirationDate,
  getPollPreviewModel,
  isPollExpired,
} from '@nearbyfeed/shared';
import { describe, expect, it } from 'vitest';
import { type Post } from '../../types';

const makePoll = (
  overrides: Partial<NonNullable<Post['poll']>> = {},
): NonNullable<Post['poll']> => ({
  id: 8,
  options: [
    {
      id: 1,
      order: 0,
      pollId: 8,
      text: 'worth the line',
      voteCount: 2,
    },
    {
      id: 2,
      order: 1,
      pollId: 8,
      text: 'skip it',
      voteCount: 5,
    },
    {
      id: 3,
      order: 2,
      pollId: 8,
      text: 'go later',
      voteCount: 3,
    },
    {
      id: 4,
      order: 3,
      pollId: 8,
      text: 'ask tomorrow',
      voteCount: 0,
    },
  ],
  participantsCount: 10,
  postId: 91,
  votingLength: 5,
  ...overrides,
});

describe('poll preview presentation', () => {
  it('uses shared poll lifecycle helpers for expiration math', () => {
    const expiresAt = getPollExpirationDate(
      '2026-06-23T08:00:00.000Z',
      1,
    );

    expect(expiresAt.toISOString()).toBe('2026-06-24T08:00:00.000Z');
    expect(
      isPollExpired(
        '2026-06-23T08:00:00.000Z',
        1,
        new Date('2026-06-24T07:59:59.999Z'),
      ),
    ).toBe(false);
    expect(
      isPollExpired(
        '2026-06-23T08:00:00.000Z',
        1,
        new Date('2026-06-24T08:00:00.000Z'),
      ),
    ).toBe(true);
  });

  it('ranks visible options by votes and keeps the hidden count', () => {
    const model = getPollPreviewModel(makePoll());

    expect(model.voteLabel).toBe('10 votes');
    expect(model.leaderLabel).toBe('top pick');
    expect(model.hiddenOptionCount).toBe(1);
    expect(model.options.map((option) => option.text)).toEqual([
      'skip it',
      'go later',
      'worth the line',
    ]);
    expect(model.options[0]).toMatchObject({
      isLeader: true,
      percentage: 50,
    });
    expect(model.statusLabel).toBe('Vote from details');
    expect(model.statusTone).toBe('live');
  });

  it('keeps zero-vote polls calm and avoids divide-by-zero percentages', () => {
    const model = getPollPreviewModel(
      makePoll({
        options: [
          {
            id: 1,
            order: 0,
            pollId: 8,
            text: 'first',
            voteCount: 0,
          },
          {
            id: 2,
            order: 1,
            pollId: 8,
            text: 'second',
            voteCount: 0,
          },
        ],
        participantsCount: 0,
      }),
    );

    expect(model.voteLabel).toBe('0 votes');
    expect(model.leaderLabel).toBe('waiting on votes');
    expect(model.options).toEqual([
      {
        id: 1,
        isLeader: false,
        percentage: 0,
        text: 'first',
      },
      {
        id: 2,
        isLeader: false,
        percentage: 0,
        text: 'second',
      },
    ]);
  });

  it('surfaces open poll closing time when timestamps are available', () => {
    const model = getPollPreviewModel(
      makePoll({
        createdAt: '2026-06-23T08:00:00.000Z',
        votingLength: 1,
      }),
      3,
      new Date('2026-06-23T09:00:00.000Z'),
    );

    expect(model.statusLabel).toBe('Closes in 23 hours');
    expect(model.statusTone).toBe('live');
  });

  it('marks polls as closing soon inside the final six hours', () => {
    const model = getPollPreviewModel(
      makePoll({
        createdAt: '2026-06-23T08:00:00.000Z',
        votingLength: 1,
      }),
      3,
      new Date('2026-06-24T03:30:00.000Z'),
    );

    expect(model.statusLabel).toBe('Closes in 4 hours');
    expect(model.statusTone).toBe('closing');
  });

  it('marks expired polls as closed', () => {
    const model = getPollPreviewModel(
      makePoll({
        createdAt: '2026-06-23T08:00:00.000Z',
        votingLength: 1,
      }),
      3,
      new Date('2026-06-25T08:00:00.000Z'),
    );

    expect(model.statusLabel).toBe('Closed');
    expect(model.statusTone).toBe('closed');
  });

  it('prioritizes current-user vote state over close timing', () => {
    const model = getPollPreviewModel(
      makePoll({
        createdAt: '2026-06-23T08:00:00.000Z',
        vote: {
          id: 10,
          pollId: 8,
          pollOptionId: 2,
          userId: 42,
        },
        votingLength: 1,
      }),
      3,
      new Date('2026-06-23T09:00:00.000Z'),
    );

    expect(model.statusLabel).toBe('You voted');
    expect(model.statusTone).toBe('voted');
  });
});
