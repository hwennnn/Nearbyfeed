import { type DistanceMeters, type TimeWindow } from '@nearbyfeed/shared';
import { Navigation, UserRound } from 'lucide-react';
import { type View } from '../app-types';
import { formatDistance, initials } from '../lib/format';
import { type Session } from '../types';
import { SegmentedDistance, SegmentedTime } from './SegmentedControls';

export const TopBar = ({
  distance,
  isDemoMode,
  locationName,
  locationStatus,
  session,
  setDistance,
  setTimeWindow,
  setView,
  timeWindow,
}: {
  distance: DistanceMeters;
  isDemoMode: boolean;
  locationName: string;
  locationStatus: string;
  session: Session | null;
  setDistance: (distance: DistanceMeters) => void;
  setTimeWindow: (window: TimeWindow) => void;
  setView: (view: View) => void;
  timeWindow: TimeWindow;
}) => (
  <header className="top-bar">
    <div className="location-pill">
      <Navigation size={18} />
      <span>{locationName}</span>
      <strong>{formatDistance(distance)}</strong>
    </div>
    <SegmentedDistance value={distance} onChange={setDistance} />
    <SegmentedTime value={timeWindow} onChange={setTimeWindow} />
    <div className="top-actions">
      {isDemoMode && <span className="signal-chip">preview pulse</span>}
      <span className={`signal-chip ${locationStatus === 'live' ? 'is-live' : ''}`}>
        {locationStatus === 'live' ? 'GPS live' : 'fallback'}
      </span>
      <button className="icon-button" onClick={() => setView('profile')} title="Profile">
        {session === null ? <UserRound /> : <span>{initials(session.user.username)}</span>}
      </button>
    </div>
  </header>
);
