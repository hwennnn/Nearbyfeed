import { ArrowUpRight, Map } from 'lucide-react';

export const FeedSceneBoardActions = ({
  onOpenMap,
  onOpenPost,
  primaryActionLabel,
  primaryPostId,
}: {
  onOpenMap: () => void;
  onOpenPost: (postId: number) => void;
  primaryActionLabel: string;
  primaryPostId?: number;
}) => (
  <div className="scene-board-actions">
    {primaryPostId !== undefined && (
      <button
        className="primary-button"
        onClick={() => onOpenPost(primaryPostId)}
        type="button"
      >
        {primaryActionLabel}
        <ArrowUpRight />
      </button>
    )}
    <button className="map-command-button" onClick={onOpenMap} type="button">
      <Map />
      Open map
    </button>
  </div>
);
