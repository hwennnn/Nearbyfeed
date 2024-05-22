import type { AxiosError } from 'axios';
import { produce } from 'immer';
import { createMutation } from 'react-query-kit';

import {
  retrieveUseChildCommentsKey,
  retrieveUseCommentsKey,
} from '@/api/posts/use-vote-comment';
import { useCommentKeys } from '@/core/comments';
import { useUser } from '@/core/user';

import { client, queryClient } from '../common';
import type { Comment, User } from '../types';

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
  variables: Variables;
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
  onMutate: async (variables) => {
    const queryKey = retrieveUseChildCommentsKey(
      variables.postId,
      variables.commentId
    );

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
      parentCommentId: variables.commentId,
      points: 0,
      repliesCount: 0,
      replies: [],
      author: currentUser,
      authorId: currentUser.id,
    };

    // Update the cache optimistically by adding the new Comment to the existing list
    queryClient.setQueryData<InfiniteComments>(queryKey, (oldData) => {
      if (oldData) {
        return {
          pageParams: oldData.pageParams,
          pages: produce(oldData.pages, (draftPages) => {
            draftPages[0].comments.unshift(optimisticComment);
          }),
        };
      }
      return oldData;
    });

    // Return a context with the previous and new comment
    return { previousComments, variables, optimisticCommentId };
  },
  // If the mutation fails, use the context we returned above
  onError: (_err, variables, context) => {
    const queryKey = retrieveUseChildCommentsKey(
      variables.postId,
      variables.commentId
    );

    queryClient.setQueryData<InfiniteComments>(
      queryKey,
      context?.previousComments
    );
  },
  onSuccess: (data, variables, context) => {
    const queryKey = retrieveUseChildCommentsKey(
      variables.postId,
      variables.commentId
    );
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

    // update the inifite comments as well
    const commentsQueryKey = retrieveUseCommentsKey(
      variables.postId,
      useCommentKeys.getState().commentsQueryKey.sort
    );

    queryClient.setQueryData<InfiniteComments>(commentsQueryKey, (oldData) => {
      if (oldData) {
        return {
          pageParams: oldData.pageParams,
          pages: oldData.pages.map((page) => {
            return produce(page, (draftPage) => {
              const targetId = variables.commentId;
              const foundIndex = page.comments.findIndex(
                (comment) => comment.id === targetId
              );

              if (foundIndex !== -1) {
                const comment = draftPage.comments[foundIndex];
                comment.repliesCount += 1;
                comment.replies ??= [];
                comment.replies.push(data);
              }
            });
          }),
        };
      }
      return oldData;
    });
  },
});
