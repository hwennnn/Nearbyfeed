import { KeyRound, Map as MapIcon } from 'lucide-react';

export const MapTokenEmptyState = () => (
  <div className="map-token-empty" role="status">
    <div className="map-token-empty-card">
      <span className="map-token-empty-icon">
        <MapIcon />
      </span>
      <div>
        <strong>Map offline</strong>
        <p>Add a Mapbox token to show the live nearby map.</p>
      </div>
      <span className="map-token-empty-chip">
        <KeyRound />
        env needed
      </span>
    </div>
  </div>
);
