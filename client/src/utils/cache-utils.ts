import { produce } from 'immer';

import type { InfinitePosts, Post } from '@/api';
import { queryClient } from '@/api';
import { usePostKeys } from '@/core/posts';

export type PostsQueryData = {
  previousPosts: InfinitePosts | undefined;
  previousPost: Post | undefined;
  previousMyPosts: InfinitePosts | undefined;
};

export const updatePostsCache = async (
  postId: number,
  optimisticPostFn: (post: Post) => Post
): Promise<PostsQueryData> => {
  // 1. Handle the infinite posts
  const postsQueryKey = ['posts', usePostKeys.getState().postsQueryKey];

  // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
  await queryClient.cancelQueries({ queryKey: postsQueryKey });

  // Snapshot the previous value
  const previousPosts = queryClient.getQueryData<InfinitePosts>(postsQueryKey);

  // Update the cache optimistically by modifying the points value on the existing list
  queryClient.setQueryData<InfinitePosts>(postsQueryKey, (oldData) => {
    if (oldData) {
      return {
        pageParams: oldData.pageParams,
        pages: oldData.pages.map((page) => {
          return produce(page, (draftPage) => {
            const foundIndex = draftPage.posts.findIndex(
              (post) => post.id === postId
            );

            if (foundIndex !== -1) {
              const post = draftPage.posts[foundIndex];
              const newOptimisticPost = optimisticPostFn(post);

              draftPage.posts[foundIndex] = { ...newOptimisticPost };
            }
          });
        }),
      };
    }
    return oldData;
  });

  // 2. Handle the single post query
  const postQueryKey = ['posts', { id: postId }];

  // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
  await queryClient.cancelQueries({ queryKey: postQueryKey });

  // Snapshot the previous value
  const previousPost = queryClient.getQueryData<Post>(postQueryKey);

  queryClient.setQueryData<Post>(postQueryKey, (oldData) => {
    if (oldData) {
      return produce(oldData, (draftPost) => {
        const newOptimisticPost = optimisticPostFn(draftPost);
        return newOptimisticPost;
      });
    }

    return oldData;
  });

  // 3. Handle my posts query
  const myPostsQueryKey = ['my-posts', {}];

  // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
  await queryClient.cancelQueries({ queryKey: myPostsQueryKey });

  // Snapshot the previous value
  const previousMyPosts =
    queryClient.getQueryData<InfinitePosts>(myPostsQueryKey);

  // Update the cache optimistically by modifying the points value on the existing list
  queryClient.setQueryData<InfinitePosts>(myPostsQueryKey, (oldData) => {
    if (oldData) {
      return {
        pageParams: oldData.pageParams,
        pages: oldData.pages.map((page) => {
          return produce(page, (draftPage) => {
            const foundIndex = draftPage.posts.findIndex(
              (post) => post.id === postId
            );

            if (foundIndex !== -1) {
              const post = draftPage.posts[foundIndex];
              const newOptimisticPost = optimisticPostFn(post);

              draftPage.posts[foundIndex] = { ...newOptimisticPost };
            }
          });
        }),
      };
    }
    return oldData;
  });

  return { previousPosts, previousPost, previousMyPosts };
};

export const revertPostsCache = (
  postId: number,
  { previousMyPosts, previousPost, previousPosts }: PostsQueryData
) => {
  const postsQueryKey = ['posts', usePostKeys.getState().postsQueryKey];
  queryClient.setQueryData<InfinitePosts>(postsQueryKey, previousPosts);

  const postQueryKey = ['posts', { id: postId }];
  queryClient.setQueryData<Post>(postQueryKey, previousPost);

  const myPostsQueryKey = ['my-posts', {}];
  queryClient.setQueryData<InfinitePosts>(myPostsQueryKey, previousMyPosts);
};

export const updatePostsCacheWithData = async (
  postId: number,
  postData: Partial<Post>
): Promise<void> => {
  // 1. Handle the infinite posts
  const postsQueryKey = ['posts', usePostKeys.getState().postsQueryKey];
  await queryClient.cancelQueries({ queryKey: postsQueryKey });
  queryClient.setQueryData<InfinitePosts>(postsQueryKey, (oldData) => {
    if (oldData) {
      return {
        pageParams: oldData.pageParams,
        pages: oldData.pages.map((page) => {
          return produce(page, (draftPage) => {
            const foundIndex = draftPage.posts.findIndex(
              (post) => post.id === postId
            );

            if (foundIndex !== -1) {
              draftPage.posts[foundIndex] = {
                ...draftPage.posts[foundIndex],
                ...postData,
              };
            }
          });
        }),
      };
    }
    return oldData;
  });

  // 2. Handle the single post query
  const postQueryKey = ['posts', { id: postId }];
  await queryClient.cancelQueries({ queryKey: postQueryKey });
  queryClient.setQueryData<Post>(postQueryKey, (oldData) => {
    if (oldData) {
      return produce(oldData, (draftPost) => {
        return { ...draftPost, ...postData };
      });
    }

    return oldData;
  });

  // 3. Handle my posts query
  const myPostsQueryKey = ['my-posts', {}];
  await queryClient.cancelQueries({ queryKey: myPostsQueryKey });
  queryClient.setQueryData<InfinitePosts>(myPostsQueryKey, (oldData) => {
    if (oldData) {
      return {
        pageParams: oldData.pageParams,
        pages: oldData.pages.map((page) => {
          return produce(page, (draftPage) => {
            const foundIndex = draftPage.posts.findIndex(
              (post) => post.id === postId
            );

            if (foundIndex !== -1) {
              draftPage.posts[foundIndex] = {
                ...draftPage.posts[foundIndex],
                ...postData,
              };
            }
          });
        }),
      };
    }
    return oldData;
  });
};
