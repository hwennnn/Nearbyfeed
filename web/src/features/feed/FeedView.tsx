import { type DistanceMeters, type TimeWindow } from '@nearbyfeed/shared';
import { type LiveUpdate, type Post, type Session } from '../../types';
import { FeedHero } from './FeedHero';
import { FeedLiveLens } from './FeedLiveLens';
import { FeedMobileFilterDock } from './FeedMobileFilterDock';
import { FeedPostStack } from './FeedPostStack';
import { FeedPulseRail } from './FeedPulseRail';
import { FeedSceneBoard } from './FeedSceneBoard';
import { FeedSignalTicker } from './FeedSignalTicker';
import { type FeedAuthIntent } from './feed-auth';

export const FeedView = ({
  distance,
  fetchMorePosts,
  hasMorePosts,
  isFetchingMorePosts,
  isLiveFallback,
  isLiveFetching,
  isLoading,
  liveUpdates,
  locationName,
  onOpenMap,
  onOpenPost,
  onRequireAuth,
  posts,
  refreshLiveUpdates,
  refreshPosts,
  session,
  setDistance,
  setTimeWindow,
  timeWindow,
}: {
  distance: DistanceMeters;
  fetchMorePosts: () => void;
  hasMorePosts: boolean;
  isFetchingMorePosts: boolean;
  isLiveFallback: boolean;
  isLiveFetching: boolean;
  isLoading: boolean;
  liveUpdates: LiveUpdate[];
  locationName: string;
  onOpenMap: () => void;
  onOpenPost: (postId: number) => void;
  onRequireAuth: (intent: FeedAuthIntent) => void;
  posts: Post[];
  refreshLiveUpdates: () => void;
  refreshPosts: () => void;
  session: Session | null;
  setDistance: (distance: DistanceMeters) => void;
  setTimeWindow: (window: TimeWindow) => void;
  timeWindow: TimeWindow;
}) => (
  <section className="feed-layout">
    <div className="feed-column">
      <FeedMobileFilterDock
        distance={distance}
        setDistance={setDistance}
        setTimeWindow={setTimeWindow}
        timeWindow={timeWindow}
      />
      <FeedHero
        distance={distance}
        locationName={locationName}
        onOpenPost={onOpenPost}
        posts={posts}
        refreshPosts={refreshPosts}
      />
      <FeedSceneBoard
        isLiveFallback={isLiveFallback}
        isLiveLoading={isLiveFetching}
        liveUpdates={liveUpdates}
        onOpenMap={onOpenMap}
        onOpenPost={onOpenPost}
        onRefreshLive={refreshLiveUpdates}
        posts={posts}
      />
      <FeedLiveLens onOpenPost={onOpenPost} posts={posts} />
      <FeedSignalTicker onOpenPost={onOpenPost} posts={posts} />
      {isLoading && <div className="loading-strip">syncing the block...</div>}
      <FeedPostStack
        hasMorePosts={hasMorePosts}
        isFetchingMorePosts={isFetchingMorePosts}
        onLoadMore={fetchMorePosts}
        onOpenPost={onOpenPost}
        onRequireAuth={onRequireAuth}
        posts={posts}
        session={session}
      />
    </div>
    <FeedPulseRail onOpenPost={onOpenPost} posts={posts} />
  </section>
);
