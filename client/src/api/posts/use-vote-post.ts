import type { AxiosError } from 'axios';
import { produce } from 'immer';
import { createMutation } from 'react-query-kit';

import type { Post, PostLike } from '@/api/types';
import { usePostKeys } from '@/core/posts';
import { useUser } from '@/core/user';

import { client, queryClient } from '../common';

type Variables = {
  postId: number;
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
  variables: Variables;
  previousPost?: Post;
  previousMyPosts?: InfinitePosts;
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
  onMutate: async (variables) => {
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
            return produce(page, (draftPage) => {
              const foundIndex = draftPage.posts.findIndex(
                (post) => post.id === variables.postId
              );

              if (foundIndex !== -1) {
                const post = draftPage.posts[foundIndex];
                const newOptimisticPost = retrieveNewOptimisticPost(
                  post,
                  variables.value
                );

                post.points = newOptimisticPost.points;
                post.like = newOptimisticPost.like;
              }
            });
          }),
        };
      }
      return oldData;
    });

    // 2. Handle the single post query
    const postQueryKey = ['posts', { id: variables.postId }];

    // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
    await queryClient.cancelQueries({ queryKey: postQueryKey });

    // Snapshot the previous value
    const previousPost = queryClient.getQueryData<Post>(postQueryKey);

    queryClient.setQueryData<Post>(postQueryKey, (oldData) => {
      if (oldData) {
        return produce(oldData, (draftPost) => {
          const newOptimisticPost = retrieveNewOptimisticPost(
            oldData,
            variables.value
          );

          draftPost.points = newOptimisticPost.points;
          draftPost.like = newOptimisticPost.like;
        });
      }

      return oldData;
    });

    // 3. Handle my posts query
    const userId = useUser.getState().user?.id;
    const myPostsQueryKey = [
      'my-posts',
      {
        userId,
      },
    ];

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
                (post) => post.id === variables.postId
              );

              if (foundIndex !== -1) {
                const post = draftPage.posts[foundIndex];
                const newOptimisticPost = retrieveNewOptimisticPost(
                  post,
                  variables.value
                );

                post.points = newOptimisticPost.points;
                post.like = newOptimisticPost.like;
              }
            });
          }),
        };
      }
      return oldData;
    });

    // Return a context with the previous and new todo
    return {
      previousPosts,
      variables: variables,
      previousPost,
      previousMyPosts,
    };
  },
  // If the mutation fails, use the context we returned above
  onError: (_err, variables, context) => {
    const postsQueryKey = ['posts', usePostKeys.getState().postsQueryKey];

    queryClient.setQueryData<InfinitePosts>(
      postsQueryKey,
      context?.previousPosts
    );

    const postQueryKey = ['posts', { id: variables.postId }];

    queryClient.setQueryData<Post>(postQueryKey, context?.previousPost);

    const userId = useUser.getState().user?.id;
    const myPostsQueryKey = [
      'my-posts',
      {
        userId,
      },
    ];
    queryClient.setQueryData<InfinitePosts>(
      myPostsQueryKey,
      context?.previousMyPosts
    );
  },
  // Update the cache after success:
  onSuccess: (data, variables) => {
    const queryKey = ['posts', usePostKeys.getState().postsQueryKey];

    queryClient.setQueryData<InfinitePosts>(queryKey, (oldData) => {
      if (oldData) {
        return {
          pageParams: oldData.pageParams,
          pages: oldData.pages.map((page) => {
            return produce(page, (draftPage) => {
              const foundIndex = draftPage.posts.findIndex(
                (post) => post.id === variables.postId
              );

              if (foundIndex !== -1) {
                const post = draftPage.posts[foundIndex];

                post.points = data.post.points;
                post.like = data.like;
              }
            });
          }),
        };
      }
      return oldData;
    });

    const postQueryKey = ['posts', { id: variables.postId }];

    queryClient.setQueryData<Post>(postQueryKey, (oldData) => {
      if (oldData) {
        return produce(oldData, (draftPost) => {
          draftPost.points = data.post.points;
          draftPost.like = data.like;
        });
      }

      return oldData;
    });

    const userId = useUser.getState().user?.id;
    const myPostsQueryKey = [
      'my-posts',
      {
        userId,
      },
    ];

    queryClient.setQueryData<InfinitePosts>(myPostsQueryKey, (oldData) => {
      if (oldData) {
        return {
          pageParams: oldData.pageParams,
          pages: oldData.pages.map((page) => {
            return produce(page, (draftPage) => {
              const foundIndex = draftPage.posts.findIndex(
                (post) => post.id === variables.postId
              );

              if (foundIndex !== -1) {
                const post = draftPage.posts[foundIndex];

                post.points = data.post.points;
                post.like = data.like;
              }
            });
          }),
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
            userId: post.authorId ?? -1,
          },
  };
};
