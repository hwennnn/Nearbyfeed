import { formatSingularPlural } from '@nearbyfeed/shared';
import { Vote } from 'lucide-react';
import { type Post } from '../../types';

export const PollPreview = ({ poll }: { poll: NonNullable<Post['poll']> }) => {
  const total = Math.max(1, poll.participantsCount);

  return (
    <div className="poll-card">
      <div className="poll-heading">
        <Vote />
        <strong>Poll</strong>
        <span>
          {formatSingularPlural({
            empty: '0 votes',
            plural: 'votes',
            singular: 'vote',
            value: poll.participantsCount,
          })}
        </span>
      </div>
      {poll.options.slice(0, 3).map((option) => {
        const percentage = Math.min(
          100,
          Math.round((option.voteCount / total) * 100),
        );

        return (
          <div className="poll-option" key={option.id}>
            <span aria-hidden="true" style={{ width: `${percentage}%` }} />
            <strong>{option.text}</strong>
            <em>{percentage}%</em>
          </div>
        );
      })}
    </div>
  );
};
