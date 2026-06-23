import {
  DEFAULT_DISTANCE_METERS,
  DEFAULT_TIME_WINDOW,
  type DistanceMeters,
  type TimeWindow,
} from '@nearbyfeed/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { type View } from '../app-types';
import { type Post } from '../types';
import { useNearbyLiveUpdates } from './useNearbyLiveUpdates';
import { useNearbyLocation } from './useNearbyLocation';
import { useNearbyPosts } from './useNearbyPosts';
import { usePostDeepLink } from './usePostDeepLink';
import { useRouteTelemetry } from './useRouteTelemetry';
import { useRoutedView } from './useRoutedView';
import { useSessionState } from './useSessionState';

export const useNearbyFeedController = () => {
  const queryClient = useQueryClient();
  const [view, setView] = useRoutedView();
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [selectedPostSnapshot, setSelectedPostSnapshot] =
    useState<Post | null>(null);
  const [detailsBackView, setDetailsBackView] = useState<View>('feed');
  const [distance, setDistance] = useState<DistanceMeters>(
    DEFAULT_DISTANCE_METERS,
  );
  const [timeWindow, setTimeWindow] =
    useState<TimeWindow>(DEFAULT_TIME_WINDOW);
  const { session, handleSession, signOut } = useSessionState();
  const { coordinates, locationName, locationStatus } = useNearbyLocation();
  const {
    fetchMorePosts,
    hasMorePosts,
    isDemoMode,
    isFetchingMorePosts,
    posts,
    postsQuery,
  } = useNearbyPosts({
    coordinates,
    distance,
    timeWindow,
  });
  const {
    isLiveFallback,
    isLiveFetching,
    liveUpdates,
    refreshLiveUpdates,
  } = useNearbyLiveUpdates({
    coordinates,
    distance,
    locationName,
    timeWindow,
    view,
  });
  const openPost = (postOrId: number | Post, backView: View = view) => {
    const nextPostId =
      typeof postOrId === 'number' ? postOrId : postOrId.id;

    setSelectedPostId(nextPostId);
    setSelectedPostSnapshot(typeof postOrId === 'number' ? null : postOrId);
    setDetailsBackView(backView);
    setView('details');
  };
  const selectedPost =
    posts.find((post) => post.id === selectedPostId) ??
    selectedPostSnapshot ??
    undefined;

  usePostDeepLink({
    openPost,
    posts,
  });

  useRouteTelemetry({
    distance,
    locationStatus,
    timeWindow,
    view,
  });

  const onPostCreated = () => {
    void queryClient.invalidateQueries({ queryKey: ['posts'] });
    setSelectedPostId(null);
    setSelectedPostSnapshot(null);
    setView('feed');
  };

  return {
    coordinates,
    distance,
    fetchMorePosts,
    handleSession,
    hasMorePosts,
    isDemoMode,
    isFetchingMorePosts,
    isPostsLoading: postsQuery.isLoading,
    isLiveFallback,
    isLiveFetching,
    detailsBackView,
    liveUpdates,
    locationName,
    locationStatus,
    onPostCreated,
    openPost,
    posts,
    refreshLiveUpdates,
    refreshPosts: () => void postsQuery.refetch(),
    selectedPost,
    selectedPostId,
    session,
    setDistance,
    setSelectedPostId,
    setTimeWindow,
    setView,
    signOut,
    timeWindow,
    view,
  };
};

export type NearbyFeedController = ReturnType<typeof useNearbyFeedController>;
