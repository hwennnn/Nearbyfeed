import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import type { Comment, CommentLike } from '@/api/types';
import type { CommentsSort } from '@/core/comments';
import { useCommentKeys } from '@/core/comments';

import { client, queryClient } from '../common';

export enum CommentType {
  PARENT_COMMENT = 0,
  REPLY_COMMENT = 1,
  PREVIEW_COMMENT = 2,
}

type Variables = {
  postId: string;
  commentId: string;
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
  newComment: Variables;
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
  onMutate: async (newComment) => {
    // 1. Handle the infinite comments (either from the base comments or child comments)
    const commentsQueryKey =
      newComment.commentType === CommentType.PARENT_COMMENT ||
      newComment.commentType === CommentType.PREVIEW_COMMENT
        ? retrieveUseCommentsKey(
            +newComment.postId,
            useCommentKeys.getState().commentsQueryKey.sort
          )
        : retrieveUseChildCommentsKey(
            +newComment.postId,
            +newComment.parentCommentId!
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
            const targetId =
              newComment.commentType === CommentType.PREVIEW_COMMENT
                ? newComment.parentCommentId?.toString()
                : newComment.commentId;
            const foundIndex = page.comments.findIndex(
              (comment) => comment.id.toString() === targetId
            );

            if (foundIndex !== -1) {
              if (newComment.commentType === CommentType.PREVIEW_COMMENT) {
                // Update the nested replies
                const updatedComments = [...page.comments];
                const replyIndex = updatedComments[
                  foundIndex
                ].replies.findIndex(
                  (reply) => reply.id.toString() === newComment.commentId
                );

                if (replyIndex !== -1) {
                  const newOptimisticComment = retrieveNewOptimisticComment(
                    updatedComments[foundIndex].replies[replyIndex],
                    newComment.value
                  );

                  const replies = [...updatedComments[foundIndex].replies];
                  replies[replyIndex] = {
                    ...newOptimisticComment,
                  };

                  updatedComments[foundIndex] = {
                    ...updatedComments[foundIndex],
                    replies,
                  };

                  return { ...page, comments: updatedComments };
                }
              } else {
                const updatedComments = [...page.comments];
                const newOptimisticComment = retrieveNewOptimisticComment(
                  updatedComments[foundIndex],
                  newComment.value
                );

                updatedComments[foundIndex] = {
                  ...newOptimisticComment,
                };
                return { ...page, comments: updatedComments };
              }
            }

            return page;
          }),
        };
      }
      return oldData;
    });

    // 2. Handle the single comment query
    let previousComment;
    if (newComment.commentType === CommentType.PARENT_COMMENT) {
      const commentQueryKey = [
        'posts',
        { postId: +newComment.postId, commentId: +newComment.parentCommentId! },
      ];

      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: commentQueryKey });

      // Snapshot the previous value
      previousComment = queryClient.getQueryData<Comment>(commentQueryKey);

      queryClient.setQueryData<Comment>(commentQueryKey, (oldData) => {
        if (oldData) {
          const newOptimisticComment = retrieveNewOptimisticComment(
            oldData,
            newComment.value
          );

          return { ...newOptimisticComment };
        }

        return oldData;
      });
    }

    // Return a context with the previous and new todo
    return { previousComments, newComment, previousComment };
  },
  // If the mutation fails, use the context we returned above
  onError: (_err, newComment, context) => {
    const commentsQueryKey =
      newComment.commentType === CommentType.PARENT_COMMENT ||
      newComment.commentType === CommentType.PREVIEW_COMMENT
        ? retrieveUseCommentsKey(
            +newComment.postId,
            useCommentKeys.getState().commentsQueryKey.sort
          )
        : retrieveUseChildCommentsKey(
            +newComment.postId,
            +newComment.parentCommentId!
          );

    queryClient.setQueryData<InfiniteComments>(
      commentsQueryKey,
      context?.previousComments
    );

    if (newComment.commentType === CommentType.PARENT_COMMENT) {
      const commentQueryKey = [
        'posts',
        { postId: +newComment.postId, commentId: +newComment.commentId },
      ];

      queryClient.setQueryData<Comment>(
        commentQueryKey,
        context?.previousComment
      );
    }
  },
  // Update the cache after success:
  onSuccess: (data, newComment) => {
    const commentsQueryKey =
      newComment.commentType === CommentType.PARENT_COMMENT ||
      newComment.commentType === CommentType.PREVIEW_COMMENT
        ? retrieveUseCommentsKey(
            +newComment.postId,
            useCommentKeys.getState().commentsQueryKey.sort
          )
        : retrieveUseChildCommentsKey(
            +newComment.postId,
            +newComment.commentId
          );

    queryClient.setQueryData<InfiniteComments>(commentsQueryKey, (oldData) => {
      if (oldData) {
        return {
          pageParams: oldData.pageParams,
          pages: oldData.pages.map((page) => {
            const targetId =
              newComment.commentType === CommentType.PREVIEW_COMMENT
                ? newComment.parentCommentId?.toString()
                : newComment.commentId;
            const foundIndex = page.comments.findIndex(
              (comment) => comment.id.toString() === targetId
            );

            if (foundIndex !== -1) {
              const updatedComments = [...page.comments];

              if (newComment.commentType === CommentType.PREVIEW_COMMENT) {
                // Update the nested replies
                const replyIndex = updatedComments[
                  foundIndex
                ].replies.findIndex(
                  (reply) => reply.id.toString() === newComment.commentId
                );

                if (replyIndex !== -1) {
                  const replies = [...updatedComments[foundIndex].replies];
                  replies[replyIndex] = {
                    ...replies[replyIndex],
                    ...data.comment,
                    like: data.like,
                  };

                  updatedComments[foundIndex] = {
                    ...updatedComments[foundIndex],
                    replies,
                  };

                  return { ...page, comments: updatedComments };
                } else {
                  updatedComments[foundIndex] = {
                    ...updatedComments[foundIndex],
                    ...data.comment,
                    like: data.like,
                    author: updatedComments[foundIndex].author,
                  };
                  return { ...page, comments: updatedComments };
                }
              }
            }

            return page;
          }),
        };
      }
      return oldData;
    });

    if (newComment.commentType === CommentType.PARENT_COMMENT) {
      const commentQueryKey = [
        'posts',
        { postId: +newComment.postId, commentId: +newComment.commentId },
      ];

      queryClient.setQueryData<Comment>(commentQueryKey, (oldData) => {
        if (oldData) {
          return {
            author: oldData.author,
            ...data.comment,
            like: data.like,
          };
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

export const retrieveUseChildCommentsKey = (
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
