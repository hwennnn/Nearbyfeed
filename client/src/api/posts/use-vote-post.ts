import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import type { Post, Updoot } from '@/api/types';
import { usePostKeys } from '@/core/posts';

import { client, queryClient } from '../common';

type Variables = {
  postId: string;
  value: number;
};
type Response = {
  updoot: Updoot;
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
  previousPosts?: InfinitePosts[];
  newPost: Variables;
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
    const queryKey = ['posts', usePostKeys.getState().postsQueryKey];

    // Cancel any outgoing refetches
    // (so they don't overwrite our optimistic update)
    await queryClient.cancelQueries({ queryKey });

    // Snapshot the previous value
    const previousPosts = queryClient.getQueryData<InfinitePosts[]>(queryKey);

    // Update the cache optimistically by modifying the points value on the existing list
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

    // Return a context with the previous and new todo
    return { previousPosts, newPost };
  },
  // If the mutation fails, use the context we returned above
  onError: (_err, _newPost, context) => {
    const queryKey = ['posts', usePostKeys.getState().postsQueryKey];

    queryClient.setQueryData<InfinitePosts[]>(queryKey, context?.previousPosts);
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
                updoot: data.updoot,
              };
              return { ...page, posts: updatedPosts };
            }

            return page;
          }),
        };
      }
      return oldData;
    });
  },
});

const retrieveNewOptimisticPost = (post: Post, value: number): Post => {
  let updoot = post.updoot ?? null;

  let incrementValue = value;

  // If the user has already voted on the post
  if (updoot !== null) {
    // If the user's vote is the same as the current vote
    if (updoot.value === value) {
      // nothing changed
      incrementValue = 0;
    } else {
      // If the user is changing their vote
      if (updoot.value !== 0 && value === 0) {
        // If the previous vote was not 0 and the new vote is 0, set the increment value to the inverse of the previous vote
        incrementValue = -updoot.value;
      } else {
        // If the previous vote was 0 or the new vote is not 0, set the increment value to the new vote multiplied by 2
        incrementValue = updoot.value === 0 ? value : value * 2;
      }
    }
  }

  return {
    ...post,
    points: post.points + incrementValue,
    updoot:
      updoot !== null
        ? {
            ...updoot,
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
