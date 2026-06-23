import { Bell, ExternalLink, RefreshCw, Sparkles } from 'lucide-react';
import { timeAgo } from '../../lib/format';
import { type LiveUpdate } from '../../types';

export const MapLiveUpdateList = ({
  isFallback,
  isLoading,
  liveUpdates,
  onRefreshLive,
}: {
  isFallback: boolean;
  isLoading: boolean;
  liveUpdates: LiveUpdate[];
  onRefreshLive: () => void;
}) => (
  <div className="live-stack">
    <div className="map-live-status">
      <span className="map-live-status-label">
        <Sparkles />
        {isFallback ? 'preview enrichment' : 'live enrichment'}
      </span>
      {isLoading && <em>refreshing</em>}
      <button
        aria-label="Check live again"
        className="map-live-refresh"
        disabled={isLoading}
        onClick={onRefreshLive}
        title="Check live again"
        type="button"
      >
        <RefreshCw />
      </button>
    </div>
    {liveUpdates.map((update) => (
      <a href={update.url} key={update.id} rel="noreferrer" target="_blank">
        <span>
          <Bell />
          {timeAgo(update.occurredAt)}
        </span>
        <strong>{update.title}</strong>
        <p>{update.summary}</p>
        <em>
          Open source
          <ExternalLink />
        </em>
      </a>
    ))}
  </div>
);
