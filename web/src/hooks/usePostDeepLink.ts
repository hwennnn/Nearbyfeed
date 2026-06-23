import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import { type View } from '../app-types';
import { fetchPost } from '../lib/api';
import { type Post } from '../types';

export const getPostDeepLinkId = (
  search = globalThis.location?.search ?? '',
): number | null => {
  const postId = new URLSearchParams(search).get('post');
  if (postId === null || !/^[1-9]\d*$/.test(postId)) return null;

  const parsedPostId = Number(postId);
  return Number.isSafeInteger(parsedPostId) ? parsedPostId : null;
};

export const usePostDeepLink = ({
  openPost,
  posts,
}: {
  openPost: (postOrId: number | Post, backView?: View) => void;
  posts: Post[];
}) => {
  const consumedPostIdRef = useRef<number | null>(null);
  const postId = useMemo(() => getPostDeepLinkId(), []);
  const nearbyPost = posts.find((post) => post.id === postId);
  const shouldFetchPost =
    postId !== null &&
    nearbyPost === undefined &&
    consumedPostIdRef.current !== postId;
  const postQuery = useQuery({
    enabled: shouldFetchPost,
    queryFn: async () => await fetchPost(postId as number),
    queryKey: ['post', postId],
    retry: false,
  });

  useEffect(() => {
    if (postId === null || consumedPostIdRef.current === postId) return;

    if (nearbyPost !== undefined) {
      consumedPostIdRef.current = postId;
      openPost(nearbyPost, 'feed');
      return;
    }

    if (postQuery.data !== undefined && postQuery.data !== null) {
      consumedPostIdRef.current = postId;
      openPost(postQuery.data, 'feed');
    }
  }, [nearbyPost, openPost, postId, postQuery.data]);

  return {
    deepLinkedPostId: postId,
    isLoadingDeepLinkedPost: postQuery.isFetching,
  };
};
