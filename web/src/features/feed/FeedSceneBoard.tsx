import { Radio } from 'lucide-react';
import { type LiveUpdate, type Post } from '../../types';
import { FeedSceneBoardActions } from './FeedSceneBoardActions';
import { FeedSceneLiveSource } from './FeedSceneLiveSource';
import { FeedSceneMomentAction } from './FeedSceneMomentAction';
import { FeedSceneStats } from './FeedSceneStats';
import { getFeedSceneBoard } from './feed-presentation';

export const FeedSceneBoard = ({
  isLiveFallback = false,
  isLiveLoading = false,
  liveUpdates,
  onOpenMap,
  onOpenPost,
  onRefreshLive,
  posts,
}: {
  isLiveFallback?: boolean;
  isLiveLoading?: boolean;
  liveUpdates: LiveUpdate[];
  onOpenMap: () => void;
  onOpenPost: (postId: number) => void;
  onRefreshLive?: () => void;
  posts: Post[];
}) => {
  const scene = getFeedSceneBoard(posts, liveUpdates);

  return (
    <section
      aria-label="Nearby scene board"
      className={`feed-scene-board is-${scene.status}`}
    >
      <div className="scene-board-copy">
        <span className="scene-board-kicker">
          <Radio />
          scene board
          <em>{scene.statusLabel}</em>
        </span>
        <h2>{scene.headline}</h2>
        <p>{scene.subline}</p>
        <FeedSceneLiveSource
          isLiveFallback={isLiveFallback}
          isLiveLoading={isLiveLoading}
          onRefreshLive={onRefreshLive}
        />
        <FeedSceneBoardActions
          onOpenMap={onOpenMap}
          onOpenPost={onOpenPost}
          primaryActionLabel={scene.primaryActionLabel}
          primaryPostId={scene.primaryPostId}
        />
      </div>

      <FeedSceneStats stats={scene.stats} />

      <div className="scene-board-moments">
        {scene.moments.length === 0 ? (
          <div className="scene-board-empty">
            <strong>Quiet block</strong>
            <span>Open the map and find the first pocket of movement.</span>
          </div>
        ) : (
          scene.moments.map((moment) => (
            <FeedSceneMomentAction
              key={moment.id}
              moment={moment}
              onOpenPost={onOpenPost}
            />
          ))
        )}
      </div>
    </section>
  );
};
