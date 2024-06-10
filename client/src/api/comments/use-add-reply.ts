import type { AxiosError } from 'axios';
import { produce } from 'immer';
import { createMutation } from 'react-query-kit';

import {
  retrieveUseChildCommentsKey,
  retrieveUseCommentKey,
  retrieveUseCommentsKey,
} from '@/api/comments/types';
import type { InfinitePosts } from '@/api/posts/types';
import { useCommentKeys } from '@/core/comments';
import { useUser } from '@/core/user';
import type { PostsQueryData } from '@/utils/cache-utils';
import { revertPostsCache, updatePostsCache } from '@/utils/cache-utils';

import { client, queryClient } from '../common';
import type { Comment, Post, User } from '../types';
import type { InfiniteComments } from './types';

type Variables = {
  content: string;
  postId: number;
  commentId: number;
};
type Response = Comment;
type Context = {
  previousPosts?: InfinitePosts;
  previousMyPosts?: InfinitePosts;
  previousPost?: Post;
  previousComments?: InfiniteComments;
  previousComment?: Comment;
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
    // 1. Handle the child comments
    const childCommentsQueryKey = retrieveUseChildCommentsKey(
      variables.postId,
      variables.commentId
    );
    await queryClient.cancelQueries({ queryKey: childCommentsQueryKey });
    const previousComments = queryClient.getQueryData<InfiniteComments>(
      childCommentsQueryKey
    );

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
    queryClient.setQueryData<InfiniteComments>(
      childCommentsQueryKey,
      (oldData) => {
        if (oldData) {
          return {
            pageParams: oldData.pageParams,
            pages: produce(oldData.pages, (draftPages) => {
              draftPages[0].comments.unshift(optimisticComment);
            }),
          };
        }
        return oldData;
      }
    );

    // 2. Handle the single comment -> update the replies count
    const commentQueryKey = retrieveUseCommentKey(
      variables.postId,
      variables.commentId
    );
    await queryClient.cancelQueries({ queryKey: commentQueryKey });
    const previousComment = queryClient.getQueryData<Comment>(commentQueryKey);

    queryClient.setQueryData<Comment>(commentQueryKey, (oldData) => {
      if (oldData) {
        return produce(oldData, (draftComment) => {
          draftComment.repliesCount += 1;
        });
      }

      return oldData;
    });

    // 3. update the post replies count
    const { previousMyPosts, previousPost, previousPosts } =
      await updatePostsCache(variables.postId, retrieveNewOptimisticPost);

    // Return a context with the previous and new comment
    return {
      previousMyPosts,
      previousPost,
      previousPosts,
      previousComments,
      previousComment,
      variables,
      optimisticCommentId,
    };
  },
  // If the mutation fails, use the context we returned above
  onError: (_err, variables, context) => {
    const childCommentsQueryKey = retrieveUseChildCommentsKey(
      variables.postId,
      variables.commentId
    );

    queryClient.setQueryData<InfiniteComments>(
      childCommentsQueryKey,
      context?.previousComments
    );

    const commentQueryKey = retrieveUseCommentKey(
      variables.postId,
      variables.commentId
    );
    queryClient.setQueryData<Comment>(
      commentQueryKey,
      context?.previousComment
    );

    const postsQueryData: PostsQueryData = {
      previousMyPosts: context?.previousMyPosts,
      previousPost: context?.previousPost,
      previousPosts: context?.previousPosts,
    };

    revertPostsCache(variables.postId, postsQueryData);
  },
  onSuccess: async (data, variables, context) => {
    const childCommentsQueryKey = retrieveUseChildCommentsKey(
      variables.postId,
      variables.commentId
    );
    const optimisticCommentId = context?.optimisticCommentId;
    queryClient.setQueryData<InfiniteComments>(
      childCommentsQueryKey,
      (oldData) => {
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
      }
    );

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

    await queryClient.invalidateQueries(['my-comments', {}]);
  },
});

const retrieveNewOptimisticPost = (post: Post): Post => {
  return {
    ...post,
    commentsCount: post.commentsCount + 1,
  };
};
