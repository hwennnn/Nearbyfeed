import {
  Activity,
  MessageCircle,
  Radio,
  SatelliteDish,
  Vote,
} from 'lucide-react';
import { type LiveUpdate, type Post } from '../../types';
import { getMapPulseMetrics } from './map-presentation';

export const MapPulseStats = ({
  liveUpdates,
  posts,
}: {
  liveUpdates: LiveUpdate[];
  posts: Post[];
}) => {
  const metrics = getMapPulseMetrics(posts, liveUpdates);

  return (
    <div className="map-pulse-stats" aria-label="Nearby pulse stats">
      <div
        aria-label={`Pulse score ${metrics.score}`}
        className={`map-pulse-score is-${metrics.level}`}
      >
        <Activity />
        <span>{metrics.level}</span>
        <strong>{metrics.score}</strong>
      </div>
      <div aria-label={`${metrics.postCount} drops nearby`}>
        <Radio />
        <span>drops</span>
        <strong>{metrics.postCount}</strong>
      </div>
      <div
        aria-label={`${metrics.liveCount} X live signals nearby`}
        className="map-pulse-live-stat"
      >
        <SatelliteDish />
        <span>X live</span>
        <strong>{metrics.liveCount}</strong>
      </div>
      <div aria-label={`${metrics.replyCount} replies nearby`}>
        <MessageCircle />
        <span>replies</span>
        <strong>{metrics.replyCount}</strong>
      </div>
      <div aria-label={`${metrics.pollCount} polls nearby`}>
        <Vote />
        <span>polls</span>
        <strong>{metrics.pollCount}</strong>
      </div>
    </div>
  );
};
