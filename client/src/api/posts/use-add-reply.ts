import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client, queryClient } from '../common';
import type { Comment } from '../types';

type Variables = {
  content: string;
  postId: number;
  commentId: number;
};
type Response = Comment;
type CommentsResponse = {
  comments: Comment[];
  hasMore: boolean;
};
type InfiniteComments = {
  pages: CommentsResponse[];
  pageParams: unknown[];
};
type Context = {
  previousComments?: InfiniteComments;
  newComment: Variables;
  optimisticCommentId: number;
};

export const useAddReply = createMutation<
  Response,
  Variables,
  AxiosError,
  Context
>({
  mutationFn: async (variables) => {
    const response = await client({
      url: `posts/${variables.postId}/comments/${variables.commentId}`,
      method: 'POST',
      data: {
        content: variables.content,
      },
    }).catch((error) => {
      return Promise.reject(error);
    });

    return response.data;
  },
  onMutate: async (newComment) => {
    const queryKey = [
      'comments',
      {
        postId: newComment.postId,
        commmentId: newComment.commentId,
      },
    ];

    // Cancel any outgoing refetches
    // (so they don't overwrite our optimistic update)
    await queryClient.cancelQueries({ queryKey });

    // Snapshot the previous value
    const previousComments =
      queryClient.getQueryData<InfiniteComments>(queryKey);

    const optimisticCommentId = new Date().getTime();
    const optimisticComment: Comment = {
      id: optimisticCommentId,
      content: newComment.content,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false,
      postId: newComment.postId,
      authorId: 1,
      isOptimistic: true,
      parentCommentId: newComment.commentId,
      points: 0,
      repliesCount: 0,
    };

    // Update the cache optimistically by adding the new Comment to the existing list
    queryClient.setQueryData<InfiniteComments>(queryKey, (oldData) => {
      if (oldData) {
        const updatedPage = {
          ...oldData.pages[0],
          comments: [optimisticComment, ...oldData.pages[0].comments],
        };

        return {
          pageParams: oldData.pageParams,
          pages: [updatedPage, ...oldData.pages.slice(1)],
        };
      }
      return oldData;
    });

    // Return a context with the previous and new comment
    return { previousComments, newComment, optimisticCommentId };
  },
  // If the mutation fails, use the context we returned above
  onError: (_err, newComment, context) => {
    const queryKey = [
      'comments',
      {
        postId: newComment.postId,
        commmentId: newComment.commentId,
      },
    ];

    queryClient.setQueryData<InfiniteComments>(
      queryKey,
      context?.previousComments
    );
  },
  onSuccess: (data, variables, context) => {
    const queryKey = [
      'comments',
      {
        postId: variables.postId,
        commmentId: variables.commentId,
      },
    ];
    const optimisticCommentId = context?.optimisticCommentId;
    // Update the cache with the response data from the API

    queryClient.setQueryData<InfiniteComments>(queryKey, (oldData) => {
      if (oldData) {
        return {
          pageParams: oldData.pageParams,
          pages: oldData.pages.map((page) => {
            const foundIndex = page.comments.findIndex(
              (comment) => comment.id === optimisticCommentId
            );

            if (foundIndex !== -1) {
              const updatedComments = [...page.comments];
              updatedComments[foundIndex] = data;
              return { ...page, comments: updatedComments };
            }

            return page;
          }),
        };
      }
      return oldData;
    });
  },
});
