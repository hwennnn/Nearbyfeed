import 'mapbox-gl/dist/mapbox-gl.css';
import { type DistanceMeters, type TimeWindow } from '@nearbyfeed/shared';
import { MAPBOX_ACCESS_TOKEN } from '../../lib/constants';
import { type Coordinates, type LiveUpdate, type Post } from '../../types';
import { MapLivePanel } from './MapLivePanel';
import { MapControls, MapTitlePill } from './MapOverlays';
import { getFeaturedMapPost, getMapPulseMetrics } from './map-presentation';
import { useMapboxNearbyMap } from './useMapboxNearbyMap';

export type MapViewProps = {
  coordinates: Coordinates;
  distance: DistanceMeters;
  isLiveFallback: boolean;
  isLiveLoading: boolean;
  liveUpdates: LiveUpdate[];
  locationName: string;
  onOpenPost: (postId: number) => void;
  posts: Post[];
  refreshLiveUpdates: () => void;
  selectedPostId: number | null;
  setDistance: (distance: DistanceMeters) => void;
  setSelectedPostId: (postId: number | null) => void;
  setTimeWindow: (window: TimeWindow) => void;
  timeWindow: TimeWindow;
};

export const MapView = ({
  coordinates,
  distance,
  isLiveFallback,
  isLiveLoading,
  liveUpdates,
  locationName,
  onOpenPost,
  posts,
  refreshLiveUpdates,
  selectedPostId,
  setDistance,
  setSelectedPostId,
  setTimeWindow,
  timeWindow,
}: MapViewProps) => {
  const { containerRef } = useMapboxNearbyMap({
    coordinates,
    distance,
    liveUpdates,
    posts,
    selectedPostId,
    setSelectedPostId,
  });
  const selectedPost =
    selectedPostId === null
      ? undefined
      : posts.find((post) => post.id === selectedPostId);
  const featuredPost = getFeaturedMapPost(posts);
  const pulseMetrics = getMapPulseMetrics(posts, liveUpdates);

  return (
    <section className="map-screen">
      <div className="map-canvas" ref={containerRef}>
        {MAPBOX_ACCESS_TOKEN.length === 0 && (
          <div className="map-token-empty">Mapbox token missing</div>
        )}
      </div>
      <MapTitlePill postCount={posts.length} pulseLevel={pulseMetrics.level} />
      <MapControls
        distance={distance}
        setDistance={setDistance}
        setTimeWindow={setTimeWindow}
        timeWindow={timeWindow}
      />
      <MapLivePanel
        featuredPost={featuredPost}
        isLiveFallback={isLiveFallback}
        isLiveLoading={isLiveLoading}
        liveUpdates={liveUpdates}
        locationName={locationName}
        onOpenPost={onOpenPost}
        posts={posts}
        refreshLiveUpdates={refreshLiveUpdates}
        selectedPost={selectedPost}
        selectedPostId={selectedPostId}
      />
    </section>
  );
};
