import { describe, expect, it } from 'vitest';
import { type Post } from '../../types';
import { getPollPreviewModel } from './poll-preview-presentation';

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
});
