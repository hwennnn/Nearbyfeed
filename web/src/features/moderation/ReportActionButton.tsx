import { Flag } from 'lucide-react';

export const ReportActionButton = ({
  compact = false,
  label = 'Report',
  onClick,
}: {
  compact?: boolean;
  label?: string;
  onClick: () => void;
}) => (
  <button
    aria-label={label}
    className={`report-action-button${compact ? ' is-compact' : ''}`}
    onClick={onClick}
    title={label}
    type="button"
  >
    <Flag />
    <span>{compact ? 'Report' : label}</span>
  </button>
);
