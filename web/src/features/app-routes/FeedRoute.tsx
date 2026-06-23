import { FeedView } from '../feed/FeedView';
import { type AppRouteProps } from './route-types';

export const FeedRoute = ({ app }: AppRouteProps) => (
  <FeedView
    distance={app.distance}
    fetchMorePosts={app.fetchMorePosts}
    hasMorePosts={app.hasMorePosts}
    isFetchingMorePosts={app.isFetchingMorePosts}
    isLiveFallback={app.isLiveFallback}
    isLiveFetching={app.isLiveFetching}
    isLoading={app.isPostsLoading}
    liveUpdates={app.liveUpdates}
    locationName={app.locationName}
    onOpenMap={() => app.setView('map')}
    onOpenPost={(postId) => app.openPost(postId, 'feed')}
    onRequireAuth={() => app.setView('profile')}
    posts={app.posts}
    refreshLiveUpdates={app.refreshLiveUpdates}
    refreshPosts={app.refreshPosts}
    session={app.session}
    setDistance={app.setDistance}
    setTimeWindow={app.setTimeWindow}
    timeWindow={app.timeWindow}
  />
);
