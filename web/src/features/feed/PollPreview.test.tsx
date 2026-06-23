import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { type Post } from '../../types';
import { PollPreview } from './PollPreview';

const makePoll = (
  participantsCount: number,
): NonNullable<Post['poll']> => ({
  id: 8,
  options: [
    {
      id: 1,
      order: 0,
      pollId: 8,
      text: 'worth the line',
      voteCount: participantsCount,
    },
    {
      id: 2,
      order: 1,
      pollId: 8,
      text: 'skip it',
      voteCount: 0,
    },
  ],
  participantsCount,
  postId: 91,
  votingLength: 5,
});

describe('PollPreview', () => {
  afterEach(() => {
    cleanup();
  });

  it('uses singular vote copy for one participant', () => {
    render(<PollPreview poll={makePoll(1)} />);

    expect(screen.getByText('1 vote')).toBeInTheDocument();
    expect(screen.queryByText('1 votes')).not.toBeInTheDocument();
  });

  it('uses plural vote copy for multiple or zero participants', () => {
    const { rerender } = render(<PollPreview poll={makePoll(2)} />);

    expect(screen.getByText('2 votes')).toBeInTheDocument();

    rerender(<PollPreview poll={makePoll(0)} />);

    expect(screen.getByText('0 votes')).toBeInTheDocument();
  });

  it('uses participant count as the percentage denominator', () => {
    render(
      <PollPreview
        poll={{
          ...makePoll(4),
          options: [
            {
              id: 1,
              order: 0,
              pollId: 8,
              text: 'go now',
              voteCount: 1,
            },
            {
              id: 2,
              order: 1,
              pollId: 8,
              text: 'wait',
              voteCount: 3,
            },
          ],
        }}
      />,
    );

    expect(screen.getByText('go now')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });
});
