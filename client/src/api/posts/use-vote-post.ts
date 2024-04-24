import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import type { Post, PostLike } from '@/api/types';
import { usePostKeys } from '@/core/posts';

import { client, queryClient } from '../common';

type Variables = {
  postId: string;
  value: number;
};
type Response = {
  like: PostLike;
  post: Post;
};
type PostsResponse = {
  posts: Post[];
  hasMore: boolean;
};
type InfinitePosts = {
  pages: PostsResponse[];
  pageParams: unknown[];
};
type Context = {
  previousPosts?: InfinitePosts;
  newPost: Variables;
  previousPost?: Post;
};

export const useVotePost = createMutation<
  Response,
  Variables,
  AxiosError,
  Context
>({
  mutationFn: async (variables) =>
    client({
      url: `posts/${variables.postId}/vote`,
      method: 'PUT',
      data: {
        value: variables.value,
      },
    })
      .then((response) => response.data)
      .catch((error) => {
        return Promise.reject(error);
      }),
  // When mutate is called:
  onMutate: async (newPost) => {
    // 1. Handle the infinite posts
    const postsQueryKey = ['posts', usePostKeys.getState().postsQueryKey];

    // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
    await queryClient.cancelQueries({ queryKey: postsQueryKey });

    // Snapshot the previous value
    const previousPosts =
      queryClient.getQueryData<InfinitePosts>(postsQueryKey);

    // Update the cache optimistically by modifying the points value on the existing list
    queryClient.setQueryData<InfinitePosts>(postsQueryKey, (oldData) => {
      if (oldData) {
        return {
          pageParams: oldData.pageParams,
          pages: oldData.pages.map((page) => {
            const foundIndex = page.posts.findIndex(
              (post) => post.id.toString() === newPost.postId
            );

            if (foundIndex !== -1) {
              const updatedPosts = [...page.posts];
              const newOptimisticPost = retrieveNewOptimisticPost(
                updatedPosts[foundIndex],
                newPost.value
              );
              updatedPosts[foundIndex] = {
                ...newOptimisticPost,
              };
              return { ...page, posts: updatedPosts };
            }

            return page;
          }),
        };
      }
      return oldData;
    });

    // 2. Handle the single post query
    const postQueryKey = ['posts', { id: +newPost.postId }];

    // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
    await queryClient.cancelQueries({ queryKey: postQueryKey });

    // Snapshot the previous value
    const previousPost = queryClient.getQueryData<Post>(postQueryKey);

    queryClient.setQueryData<Post>(postQueryKey, (oldData) => {
      if (oldData) {
        const newOptimisticPost = retrieveNewOptimisticPost(
          oldData,
          newPost.value
        );

        return { ...newOptimisticPost };
      }

      return oldData;
    });

    // Return a context with the previous and new todo
    return { previousPosts, newPost, previousPost };
  },
  // If the mutation fails, use the context we returned above
  onError: (_err, newPost, context) => {
    const postsQueryKey = ['posts', usePostKeys.getState().postsQueryKey];

    queryClient.setQueryData<InfinitePosts>(
      postsQueryKey,
      context?.previousPosts
    );

    const postQueryKey = ['posts', { id: +newPost.postId }];

    queryClient.setQueryData<Post>(postQueryKey, context?.previousPost);
  },
  // Update the cache after success:
  onSuccess: (data, newPost) => {
    const queryKey = ['posts', usePostKeys.getState().postsQueryKey];

    queryClient.setQueryData<InfinitePosts>(queryKey, (oldData) => {
      if (oldData) {
        return {
          pageParams: oldData.pageParams,
          pages: oldData.pages.map((page) => {
            const foundIndex = page.posts.findIndex(
              (post) => post.id.toString() === newPost.postId
            );

            if (foundIndex !== -1) {
              const updatedPosts = [...page.posts];
              updatedPosts[foundIndex] = {
                author: updatedPosts[foundIndex].author,
                ...data.post,
                like: data.like,
              };
              return { ...page, posts: updatedPosts };
            }

            return page;
          }),
        };
      }
      return oldData;
    });

    const postQueryKey = ['posts', { id: +newPost.postId }];

    queryClient.setQueryData<Post>(postQueryKey, (oldData) => {
      if (oldData) {
        return {
          author: oldData.author,
          ...data.post,
          like: data.like,
        };
      }

      return oldData;
    });
  },
});

const retrieveNewOptimisticPost = (post: Post, value: number): Post => {
  let like = post.like ?? null;

  let incrementValue = value;

  // If the user has already liked the post
  if (like !== null) {
    // If the user's vote is the same as the current vote
    if (like.value === value) {
      // nothing changed
      incrementValue = 0;
    } else {
      if (value === 1) {
        incrementValue = 1;
      } else {
        incrementValue = -1;
      }
    }
  }

  return {
    ...post,
    points: post.points + incrementValue,
    like:
      like !== null
        ? {
            ...like,
            value,
          }
        : {
            id: new Date().getTime(),
            value,
            createdAt: new Date(),
            updatedAt: new Date(),
            postId: post.id,
            userId: -1,
          },
  };
};
