import { type DistanceMeters, type TimeWindow } from '@nearbyfeed/shared';
import { SegmentedDistance, SegmentedTime } from '../../components/SegmentedControls';

export const FeedMobileFilterDock = ({
  distance,
  setDistance,
  setTimeWindow,
  timeWindow,
}: {
  distance: DistanceMeters;
  setDistance: (distance: DistanceMeters) => void;
  setTimeWindow: (window: TimeWindow) => void;
  timeWindow: TimeWindow;
}) => (
  <div className="feed-mobile-filter-dock" aria-label="Mobile feed filters">
    <SegmentedDistance value={distance} onChange={setDistance} />
    <SegmentedTime value={timeWindow} onChange={setTimeWindow} />
  </div>
);
