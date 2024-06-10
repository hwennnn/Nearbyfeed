import type { AxiosError } from 'axios';
import { produce } from 'immer';
import { createMutation } from 'react-query-kit';

import type { InfiniteComments } from '@/api/comments/types';
import {
  CommentType,
  retrieveUseChildCommentsKey,
  retrieveUseCommentKey,
  retrieveUseCommentsKey,
} from '@/api/comments/types';
import { useCommentKeys } from '@/core/comments';
import { updatePostsCacheWithData } from '@/utils/cache-utils';

import { client, queryClient } from '../common';
import type { Comment, Post } from '../types';

type Variables = {
  postId: number;
  commentId: number;
  commentType: CommentType;
  parentCommentId: number | null;
};
type Response = Post;
type Context = {
  previousComments?: InfiniteComments;
  variables: Variables;
  previousComment?: Comment;
};

export const useDeleteComment = createMutation<
  Response,
  Variables,
  AxiosError,
  Context
>({
  mutationFn: async (variables) =>
    client({
      url: `posts/${variables.postId}/comments/${variables.commentId}`,
      method: 'DELETE',
    })
      .then((response) => response.data)
      .catch((error) => {
        return Promise.reject(error);
      }),
  onSuccess: async (data, variables) => {
    if (variables.commentType === CommentType.PARENT_COMMENT) {
      const commentsQueryKey = retrieveUseCommentsKey(
        variables.postId,
        useCommentKeys.getState().commentsQueryKey.sort
      );

      queryClient.setQueryData<InfiniteComments>(
        commentsQueryKey,
        (oldData) => {
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
                    draftPage.comments.splice(foundIndex, 1);
                  }
                });
              }),
            };
          }
          return oldData;
        }
      );
      // navigate.goBack() if its at the comment-details page.
    } else if (variables.commentType === CommentType.REPLY_COMMENT) {
      const childCommentsQueryKey = retrieveUseChildCommentsKey(
        variables.postId,
        variables.parentCommentId!
      );

      queryClient.setQueryData<InfiniteComments>(
        childCommentsQueryKey,
        (oldData) => {
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
                    draftPage.comments.splice(foundIndex, 1);
                  }
                });
              }),
            };
          }
          return oldData;
        }
      );
    }

    if (
      variables.commentType !== CommentType.PARENT_COMMENT &&
      variables.parentCommentId !== null
    ) {
      // update the replies count in the comment details page
      const commentQueryKey = retrieveUseCommentKey(
        variables.postId,
        variables.parentCommentId
      );
      queryClient.setQueryData<Comment>(commentQueryKey, (oldData) => {
        if (oldData) {
          return produce(oldData, (draftComment) => {
            draftComment.repliesCount -= 1;
          });
        }
        return oldData;
      });

      // update the replies count in the post details page
      const commentsQueryKey = retrieveUseCommentsKey(
        variables.postId,
        useCommentKeys.getState().commentsQueryKey.sort
      );

      queryClient.setQueryData<InfiniteComments>(
        commentsQueryKey,
        (oldData) => {
          if (oldData) {
            return {
              pageParams: oldData.pageParams,
              pages: oldData.pages.map((page) => {
                return produce(page, (draftPage) => {
                  const targetId = variables.parentCommentId;
                  const foundIndex = page.comments.findIndex(
                    (comment) => comment.id === targetId
                  );

                  if (foundIndex !== -1) {
                    const comment = draftPage.comments[foundIndex];

                    comment.repliesCount -= 1;

                    // update nested reply
                    const replyIndex = comment.replies.findIndex(
                      (reply) => reply.id === variables.commentId
                    );

                    if (replyIndex !== -1) {
                      comment.replies.splice(replyIndex, 1);
                    }
                  }
                });
              }),
            };
          }
          return oldData;
        }
      );
    }

    await updatePostsCacheWithData(variables.postId, {
      commentsCount: data.commentsCount,
    });

    await queryClient.invalidateQueries(['my-comments', {}]);
  },
});
