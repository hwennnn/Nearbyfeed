import { Flame, MessageCircle, RadioTower, SatelliteDish } from 'lucide-react';
import { type LiveUpdate, type Post } from '../../types';
import { getMapLiveSheetSummary } from './map-presentation';

const statIcons = {
  drops: RadioTower,
  replies: MessageCircle,
  'X live': SatelliteDish,
} as const;

export const MapLiveSheetHeader = ({
  liveUpdates,
  locationName,
  posts,
}: {
  liveUpdates: LiveUpdate[];
  locationName: string;
  posts: Post[];
}) => {
  const summary = getMapLiveSheetSummary(locationName, posts, liveUpdates);

  return (
    <header
      aria-label="Nearby live sheet"
      className={`map-live-sheet-head is-${summary.tone}`}
    >
      <span className="map-sheet-grabber" aria-hidden="true" />
      <div className="map-live-sheet-location">
        <span className="live-dot" />
        <div>
          <p>{summary.kicker}</p>
          <h2>{locationName}</h2>
        </div>
      </div>
      <div className="map-live-sheet-summary">
        <strong>{summary.headline}</strong>
        <p>{summary.detail}</p>
      </div>
      <div className="map-live-sheet-footer">
        <div
          aria-label="Live sheet quick stats"
          className="map-live-sheet-chips"
        >
          {summary.statChips.map((chip) => {
            const Icon = statIcons[chip.label];

            return (
              <span key={chip.label}>
                <Icon />
                <em>{chip.value}</em>
                {chip.label}
              </span>
            );
          })}
        </div>
        <span className="map-live-sheet-action">
          <Flame />
          {summary.action}
        </span>
      </div>
    </header>
  );
};
