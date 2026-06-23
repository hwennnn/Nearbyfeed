import { RefreshCw, SatelliteDish } from 'lucide-react';

export const FeedSceneLiveSource = ({
  isLiveFallback,
  isLiveLoading,
  onRefreshLive,
}: {
  isLiveFallback: boolean;
  isLiveLoading: boolean;
  onRefreshLive?: () => void;
}) => {
  const liveSourceLabel = isLiveFallback ? 'Preview' : 'Live';
  const liveSourceStatus = isLiveLoading
    ? 'checking nearby signals'
    : isLiveFallback
      ? 'local pulse'
      : 'X pulse synced';

  return (
    <div className={`scene-live-source ${isLiveFallback ? 'is-preview' : 'is-live'}`}>
      <SatelliteDish />
      <span aria-live="polite">
        <strong>{liveSourceLabel}</strong>
        <em>{liveSourceStatus}</em>
      </span>
      {isLiveFallback && onRefreshLive !== undefined && (
        <button
          aria-label="Check live"
          className="scene-refresh-button"
          disabled={isLiveLoading}
          onClick={onRefreshLive}
          title="Check live"
          type="button"
        >
          <RefreshCw />
        </button>
      )}
    </div>
  );
};
