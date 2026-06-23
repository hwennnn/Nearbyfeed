import {
  DISTANCE_OPTIONS_METERS,
  TIME_WINDOW_OPTIONS,
  type DistanceMeters,
  type TimeWindow,
} from '@nearbyfeed/shared';
import { formatDistance } from '../lib/format';

export const SegmentedDistance = ({
  onChange,
  value,
}: {
  onChange: (distance: DistanceMeters) => void;
  value: DistanceMeters;
}) => (
  <div className="segmented-control" aria-label="Distance">
    {DISTANCE_OPTIONS_METERS.map((distance) => (
      <button
        className={value === distance ? 'is-selected' : ''}
        key={distance}
        onClick={() => onChange(distance)}
      >
        {formatDistance(distance)}
      </button>
    ))}
  </div>
);

export const SegmentedTime = ({
  onChange,
  value,
}: {
  onChange: (window: TimeWindow) => void;
  value: TimeWindow;
}) => (
  <div className="segmented-control" aria-label="Time window">
    {TIME_WINDOW_OPTIONS.map((window) => (
      <button
        className={value === window.value ? 'is-selected' : ''}
        key={window.value}
        onClick={() => onChange(window.value)}
      >
        {window.label}
      </button>
    ))}
  </div>
);
