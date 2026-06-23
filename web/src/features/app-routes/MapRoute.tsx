import { MapViewBoundary } from '../map/MapViewBoundary';
import { type AppRouteProps } from './route-types';

export const MapRoute = ({ app }: AppRouteProps) => (
  <MapViewBoundary
    coordinates={app.coordinates}
    distance={app.distance}
    isLiveFallback={app.isLiveFallback}
    isLiveLoading={app.isLiveFetching}
    liveUpdates={app.liveUpdates}
    locationName={app.locationName}
    onOpenPost={(postId) => app.openPost(postId, 'map')}
    posts={app.posts}
    refreshLiveUpdates={app.refreshLiveUpdates}
    selectedPostId={app.selectedPostId}
    setDistance={app.setDistance}
    setSelectedPostId={app.setSelectedPostId}
    setTimeWindow={app.setTimeWindow}
    timeWindow={app.timeWindow}
  />
);
