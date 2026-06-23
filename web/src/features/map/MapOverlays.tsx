import {
  type DistanceMeters,
  type TimeWindow,
} from '@nearbyfeed/shared';
import { RadioTower } from 'lucide-react';
import { SegmentedDistance, SegmentedTime } from '../../components/SegmentedControls';
import { type MapPulseLevel } from './map-presentation';

export const MapTitlePill = ({
  postCount,
  pulseLevel,
}: {
  postCount: number;
  pulseLevel: MapPulseLevel;
}) => (
  <div className="map-top-left">
    <div className="map-title-pill">
      <RadioTower />
      <strong>Live nearby</strong>
      <em>{pulseLevel}</em>
      <span>{postCount}</span>
    </div>
  </div>
);

export const MapControls = ({
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
  <div className="map-controls">
    <SegmentedTime value={timeWindow} onChange={setTimeWindow} />
    <SegmentedDistance value={distance} onChange={setDistance} />
  </div>
);
