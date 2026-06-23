import { UserX } from 'lucide-react';

export const BlockUserActionButton = ({
  compact = false,
  label = 'Mute',
  onClick,
}: {
  compact?: boolean;
  label?: string;
  onClick: () => void;
}) => (
  <button
    aria-label={label}
    className={`block-user-action-button${compact ? ' is-compact' : ''}`}
    onClick={onClick}
    title={label}
    type="button"
  >
    <UserX />
    <span>{compact ? 'Mute' : label}</span>
  </button>
);
