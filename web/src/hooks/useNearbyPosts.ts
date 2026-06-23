import {
  type DistanceMeters,
  type TimeWindow,
} from '@nearbyfeed/shared';
import { useInfiniteQuery } from '@tanstack/react-query';
import { demoPosts } from '../data/demo';
import { fetchPosts } from '../lib/api';
import { type Coordinates } from '../types';

export const useNearbyPosts = ({
  coordinates,
  distance,
  timeWindow,
}: {
  coordinates: Coordinates;
  distance: DistanceMeters;
  timeWindow: TimeWindow;
}) => {
  const postsQuery = useInfiniteQuery({
    queryKey: ['posts', coordinates, distance, timeWindow],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      await fetchPosts({
        ...coordinates,
        cursor: pageParam,
        distance,
        timeWindow,
      }),
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore) return undefined;

      const lastPost = lastPage.posts.at(-1);
      return lastPost === undefined ? undefined : lastPost.id.toString();
    },
  });

  const fetchedPosts = postsQuery.data?.pages.flatMap((page) => page.posts) ?? [];
  const posts =
    fetchedPosts.length > 0
      ? fetchedPosts
      : demoPosts;

  return {
    fetchMorePosts: postsQuery.fetchNextPage,
    hasMorePosts: postsQuery.hasNextPage,
    isDemoMode:
      postsQuery.isError ||
      (postsQuery.isSuccess && fetchedPosts.length === 0),
    isFetchingMorePosts: postsQuery.isFetchingNextPage,
    posts,
    postsQuery,
  };
};
