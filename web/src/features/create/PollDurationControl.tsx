import { Clock3 } from 'lucide-react';

export const POLL_DURATION_OPTIONS_DAYS = [1, 2, 3, 4, 5, 6, 7] as const;

export const PollDurationControl = ({
  onValueChange,
  value,
}: {
  onValueChange: (value: number) => void;
  value: number;
}) => (
  <div className="poll-duration-control">
    <span>
      <Clock3 />
      Poll ends in
    </span>
    <div role="group" aria-label="Poll duration">
      {POLL_DURATION_OPTIONS_DAYS.map((days) => (
        <button
          className={value === days ? 'is-selected' : ''}
          key={days}
          onClick={() => onValueChange(days)}
          type="button"
        >
          {days}d
        </button>
      ))}
    </div>
  </div>
);
