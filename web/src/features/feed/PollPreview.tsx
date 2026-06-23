import { Vote } from 'lucide-react';
import { type Post } from '../../types';
import { getPollPreviewModel } from './poll-preview-presentation';

export const PollPreview = ({ poll }: { poll: NonNullable<Post['poll']> }) => {
  const preview = getPollPreviewModel(poll);

  return (
    <div className="poll-card">
      <div className="poll-heading">
        <span className="poll-icon-shell">
          <Vote />
        </span>
        <strong>Live poll</strong>
        <span>
          {preview.voteLabel}
        </span>
      </div>
      <div className="poll-leader-line">
        <span>{preview.leaderLabel}</span>
        {preview.hiddenOptionCount > 0 && <em>+{preview.hiddenOptionCount} more</em>}
      </div>
      <div className={`poll-status-strip is-${preview.statusTone}`}>
        <span>{preview.statusLabel}</span>
        <em>{preview.totalOptionLabel}</em>
      </div>
      {preview.options.map((option) => (
        <div
          className={`poll-option ${option.isLeader ? 'is-leading' : ''}`}
          key={option.id}
        >
          <span aria-hidden="true" style={{ width: `${option.percentage}%` }} />
          <strong>{option.text}</strong>
          <em>{option.percentage}%</em>
        </div>
      ))}
    </div>
  );
};
