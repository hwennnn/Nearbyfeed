import { useState } from 'react';
import { type LiveUpdate, type Post } from '../../types';
import { MapLiveSheetHeader } from './MapLiveSheetHeader';
import { MapLiveStoryRail } from './MapLiveStoryRail';
import { MapLiveUpdateList } from './MapLiveUpdateList';
import { MapPanelSheetToggle } from './MapPanelSheetToggle';
import { MapPulseStats } from './MapPulseStats';
import { MapSpotlightCard } from './MapSpotlightCard';
import { MapVibeCard } from './MapVibeCard';

const shouldStartCollapsed = () =>
  typeof window !== 'undefined' && window.innerWidth <= 720;

export const MapLivePanel = ({
  featuredPost,
  isLiveFallback,
  isLiveLoading,
  liveUpdates,
  locationName,
  onOpenPost,
  refreshLiveUpdates,
  selectedPost,
  selectedPostId,
  posts,
}: {
  featuredPost?: Post;
  isLiveFallback: boolean;
  isLiveLoading: boolean;
  liveUpdates: LiveUpdate[];
  locationName: string;
  onOpenPost: (postId: number) => void;
  posts: Post[];
  refreshLiveUpdates: () => void;
  selectedPost?: Post;
  selectedPostId: number | null;
}) => {
  const [isCollapsed, setIsCollapsed] = useState(shouldStartCollapsed);

  return (
    <aside
      aria-label="Nearby live map panel"
      className={`map-panel ${isCollapsed ? 'is-collapsed' : 'is-expanded'}`}
    >
      <MapPanelSheetToggle
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed((current) => !current)}
      />
      <MapLiveSheetHeader
        liveUpdates={liveUpdates}
        locationName={locationName}
        posts={posts}
      />
      <div
        className="map-panel-body"
        hidden={isCollapsed}
        id="map-panel-live-stack"
      >
        <MapVibeCard liveUpdates={liveUpdates} posts={posts} />
        <MapLiveStoryRail liveUpdates={liveUpdates} posts={posts} />
        <MapPulseStats liveUpdates={liveUpdates} posts={posts} />
        <MapSpotlightCard
          mode={selectedPostId === null ? 'featured' : 'selected'}
          onOpenPost={onOpenPost}
          post={selectedPost ?? featuredPost}
        />
        <MapLiveUpdateList
          isFallback={isLiveFallback}
          isLoading={isLiveLoading}
          liveUpdates={liveUpdates}
          onRefreshLive={refreshLiveUpdates}
        />
      </div>
    </aside>
  );
};
