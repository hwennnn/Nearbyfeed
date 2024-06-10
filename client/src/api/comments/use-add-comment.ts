import type { AxiosError } from 'axios';
import { produce } from 'immer';
import { createMutation } from 'react-query-kit';

import type { InfiniteComments } from '@/api/comments/types';
import type { InfinitePosts } from '@/api/posts';
import { useUser } from '@/core/user';
import type { PostsQueryData } from '@/utils/cache-utils';
import { revertPostsCache, updatePostsCache } from '@/utils/cache-utils';

import { client, queryClient } from '../common';
import type { Comment, Post, User } from '../types';

type Variables = {
  content: string;
  postId: number;
  sort: 'latest' | 'oldest' | 'top';
};
type Response = Comment;
type Context = {
  previousPosts?: InfinitePosts;
  previousMyPosts?: InfinitePosts;
  previousPost?: Post;
  previousComments?: InfiniteComments;
  variables: Variables;
  optimisticCommentId: number;
};

export const useAddComment = createMutation<
  Response,
  Variables,
  AxiosError,
  Context
>({
  mutationFn: async (variables) => {
    const response = await client({
      url: `posts/${variables.postId}/comments`,
      method: 'POST',
      data: {
        content: variables.content,
      },
    }).catch((error) => {
      return Promise.reject(error);
    });

    return response.data;
  },
  onMutate: async (variables) => {
    const queryKey = [
      'comments',
      {
        postId: variables.postId,
        sort: variables.sort,
      },
    ];

    // Cancel any outgoing refetches
    // (so they don't overwrite our optimistic update)
    await queryClient.cancelQueries({ queryKey });

    // Snapshot the previous value
    const previousComments =
      queryClient.getQueryData<InfiniteComments>(queryKey);

    const optimisticCommentId = new Date().getTime();
    const currentUser = useUser.getState().user as User;

    const optimisticComment: Comment = {
      id: optimisticCommentId,
      content: variables.content,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false,
      postId: variables.postId,
      isOptimistic: true,
      parentCommentId: null,
      points: 0,
      repliesCount: 0,
      replies: [],
      author: currentUser,
      authorId: currentUser.id,
    };

    // Update the cache optimistically by adding the new Comment to the existing list
    queryClient.setQueryData<InfiniteComments>(queryKey, (oldData) => {
      if (oldData) {
        if (variables.sort === 'latest') {
          return {
            pageParams: oldData.pageParams,
            pages: produce(oldData.pages, (draftPages) => {
              draftPages[0].comments.unshift(optimisticComment);
            }),
          };
        } else {
          // If the sort parameter is not 'latest', you need to determine where to place the optimistic comment
          return {
            pageParams: oldData.pageParams,
            pages: produce(oldData.pages, (draftPages) => {
              draftPages[oldData.pages.length - 1].comments.push(
                optimisticComment
              );
            }),
          };
        }
      }
      return oldData;
    });

    const { previousMyPosts, previousPost, previousPosts } =
      await updatePostsCache(variables.postId, retrieveNewOptimisticPost);

    // Return a context with the previous and new comment
    return {
      previousComments,
      variables,
      optimisticCommentId,
      previousMyPosts,
      previousPost,
      previousPosts,
    };
  },
  // If the mutation fails, use the context we returned above
  onError: (_err, variables, context) => {
    const queryKey = [
      'comments',
      {
        postId: variables.postId,
        sort: variables.sort,
      },
    ];

    queryClient.setQueryData<InfiniteComments>(
      queryKey,
      context?.previousComments
    );

    const postsQueryData: PostsQueryData = {
      previousMyPosts: context?.previousMyPosts,
      previousPost: context?.previousPost,
      previousPosts: context?.previousPosts,
    };

    revertPostsCache(variables.postId, postsQueryData);
  },
  onSuccess: async (data, variables, context) => {
    const queryKey = [
      'comments',
      {
        postId: variables.postId,
        sort: variables.sort,
      },
    ];
    const optimisticCommentId = context?.optimisticCommentId;
    // Update the cache with the response data from the API

    queryClient.setQueryData<InfiniteComments>(queryKey, (oldData) => {
      if (oldData) {
        return {
          pageParams: oldData.pageParams,
          pages: oldData.pages.map((page) => {
            return produce(page, (draftPage) => {
              const foundIndex = draftPage.comments.findIndex(
                (comment) => comment.id === optimisticCommentId
              );

              if (foundIndex !== -1) {
                draftPage.comments[foundIndex] = data;
              }
            });
          }),
        };
      }
      return oldData;
    });

    await queryClient.invalidateQueries(['my-comments', {}]);
  },
});

const retrieveNewOptimisticPost = (post: Post): Post => {
  return {
    ...post,
    commentsCount: post.commentsCount + 1,
  };
};
