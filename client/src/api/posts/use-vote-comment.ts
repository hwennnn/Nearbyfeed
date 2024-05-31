import type { AxiosError } from 'axios';
import { produce } from 'immer';
import { createMutation } from 'react-query-kit';

import { type CommentsSort, useCommentKeys } from '@/core/comments';

import { client, queryClient } from '../common';
import type { Comment, CommentLike } from '../types';

export enum CommentType {
  PARENT_COMMENT = 0,
  REPLY_COMMENT = 1,
  PREVIEW_COMMENT = 2,
}

type Variables = {
  postId: number;
  commentId: number;
  value: number;
  commentType: CommentType;
  parentCommentId: number | null;
};
type Response = {
  like: CommentLike;
  comment: Comment;
};
type CommentsResponse = {
  comments: Comment[];
  hasMore: boolean;
};
export type InfiniteComments = {
  pages: CommentsResponse[];
  pageParams: unknown[];
};
type Context = {
  previousComments?: InfiniteComments;
  variables: Variables;
  previousComment?: Comment;
};

export const useVoteComment = createMutation<
  Response,
  Variables,
  AxiosError,
  Context
>({
  mutationFn: async (variables) =>
    client({
      url: `posts/${variables.postId}/comments/${variables.commentId}/vote`,
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
    // 1. Handle the infinite comments (either from the base comments or child comments)
    const commentsQueryKey =
      variables.commentType === CommentType.PARENT_COMMENT ||
      variables.commentType === CommentType.PREVIEW_COMMENT
        ? retrieveUseCommentsKey(
            variables.postId,
            useCommentKeys.getState().commentsQueryKey.sort
          )
        : retrieveUseChildCommentsKey(
            variables.postId,
            variables.parentCommentId!
          );

    // Cancel any outgoing refetches
    // (so they don't overwrite our optimistic update)
    await queryClient.cancelQueries({ queryKey: commentsQueryKey });

    // Snapshot the previous value
    const previousComments =
      queryClient.getQueryData<InfiniteComments>(commentsQueryKey);

    // Update the cache optimistically by modifying the points value on the existing list
    queryClient.setQueryData<InfiniteComments>(commentsQueryKey, (oldData) => {
      if (oldData) {
        return {
          pageParams: oldData.pageParams,
          pages: oldData.pages.map((page) => {
            return produce(page, (draftPage) => {
              const targetId =
                variables.commentType === CommentType.PREVIEW_COMMENT
                  ? variables.parentCommentId
                  : variables.commentId;
              const foundIndex = page.comments.findIndex(
                (comment) => comment.id === targetId
              );

              if (foundIndex !== -1) {
                const comment = draftPage.comments[foundIndex];

                if (variables.commentType === CommentType.PREVIEW_COMMENT) {
                  // update nested reply
                  const replyIndex = comment.replies.findIndex(
                    (reply) => reply.id === variables.commentId
                  );

                  if (replyIndex !== -1) {
                    const reply = comment.replies[replyIndex];
                    const newOptimisticComment = retrieveNewOptimisticComment(
                      reply,
                      variables.value
                    );

                    reply.points = newOptimisticComment.points;
                    reply.like = newOptimisticComment.like;
                  }
                } else {
                  const newOptimisticComment = retrieveNewOptimisticComment(
                    comment,
                    variables.value
                  );

                  comment.points = newOptimisticComment.points;
                  comment.like = newOptimisticComment.like;
                }
              }
            });
          }),
        };
      }
      return oldData;
    });

    // 2. Handle the single comment query
    let previousComment;
    if (variables.commentType === CommentType.PARENT_COMMENT) {
      const commentQueryKey = retrieveUseCommentKey(
        variables.postId,
        variables.commentId
      );

      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: commentQueryKey });

      // Snapshot the previous value
      previousComment = queryClient.getQueryData<Comment>(commentQueryKey);

      queryClient.setQueryData<Comment>(commentQueryKey, (oldData) => {
        if (oldData) {
          return produce(oldData, (draftComment) => {
            const newOptimisticComment = retrieveNewOptimisticComment(
              oldData,
              variables.value
            );

            draftComment.points = newOptimisticComment.points;
            draftComment.like = newOptimisticComment.like;
          });
        }

        return oldData;
      });
    }

    // Return a context with the previous and new todo
    return { previousComments, variables, previousComment };
  },
  // If the mutation fails, use the context we returned above
  onError: (_err, variables, context) => {
    const commentsQueryKey =
      variables.commentType === CommentType.PARENT_COMMENT ||
      variables.commentType === CommentType.PREVIEW_COMMENT
        ? retrieveUseCommentsKey(
            variables.postId,
            useCommentKeys.getState().commentsQueryKey.sort
          )
        : retrieveUseChildCommentsKey(
            variables.postId,
            variables.parentCommentId!
          );

    queryClient.setQueryData<InfiniteComments>(
      commentsQueryKey,
      context?.previousComments
    );

    if (variables.commentType === CommentType.PARENT_COMMENT) {
      const commentQueryKey = retrieveUseCommentKey(
        variables.postId,
        variables.commentId
      );

      queryClient.setQueryData<Comment>(
        commentQueryKey,
        context?.previousComment
      );
    }
  },
  // Update the cache after success:
  onSuccess: (data, variables) => {
    const commentsQueryKey =
      variables.commentType === CommentType.PARENT_COMMENT ||
      variables.commentType === CommentType.PREVIEW_COMMENT
        ? retrieveUseCommentsKey(
            variables.postId,
            useCommentKeys.getState().commentsQueryKey.sort
          )
        : retrieveUseChildCommentsKey(+variables.postId, +variables.commentId);
    queryClient.setQueryData<InfiniteComments>(commentsQueryKey, (oldData) => {
      if (oldData) {
        return {
          pageParams: oldData.pageParams,
          pages: oldData.pages.map((page) => {
            return produce(page, (draftPage) => {
              const targetId =
                variables.commentType === CommentType.PREVIEW_COMMENT
                  ? variables.parentCommentId
                  : variables.commentId;
              const foundIndex = page.comments.findIndex(
                (comment) => comment.id === targetId
              );
              if (foundIndex !== -1) {
                const comment = draftPage.comments[foundIndex];
                if (variables.commentType === CommentType.PREVIEW_COMMENT) {
                  // update nested reply
                  const replyIndex = comment.replies.findIndex(
                    (reply) => reply.id === variables.commentId
                  );
                  if (replyIndex !== -1) {
                    const reply = comment.replies[replyIndex];
                    reply.points = data.comment.points;
                    reply.like = data.like;
                  }
                } else {
                  comment.points = data.comment.points;
                  comment.like = data.like;
                }
              }
            });
          }),
        };
      }
      return oldData;
    });
    if (variables.commentType === CommentType.PARENT_COMMENT) {
      const commentQueryKey = retrieveUseCommentKey(
        variables.postId,
        variables.commentId
      );
      queryClient.setQueryData<Comment>(commentQueryKey, (oldData) => {
        if (oldData) {
          return produce(oldData, (draftComment) => {
            draftComment.points = data.comment.points;
            draftComment.like = data.like;
          });
        }
        return oldData;
      });
    }
  },
});

const retrieveNewOptimisticComment = (
  comment: Comment,
  value: number
): Comment => {
  let like = comment.like ?? null;

  let incrementValue = value;

  // If the user has already liked the comment
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
    ...comment,
    points: comment.points + incrementValue,
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
            commentId: comment.id,
            userId: -1,
          },
  };
};

export const retrieveUseCommentsKey = (
  postId: number,
  commentsSort: CommentsSort
): any => {
  return [
    'comments',
    {
      postId,
      sort: commentsSort.toString(),
    },
  ];
};

export const retrieveUseCommentKey = (
  postId: number,
  commentId: number
): any => {
  return [
    'comments',
    {
      postId,
      commentId,
    },
  ];
};

export const retrieveUseChildCommentsKey = (
  postId: number,
  commentId: number
): any => {
  return [
    'child-comments',
    {
      postId,
      commentId,
    },
  ];
};
