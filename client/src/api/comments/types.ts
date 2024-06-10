import type { Comment } from '@/api/types';

export type CommentsSort = 'latest' | 'oldest' | 'top';

export enum CommentType {
  PARENT_COMMENT = 0,
  REPLY_COMMENT = 1,
  PREVIEW_COMMENT = 2,
}

export type CommentsResponse = {
  comments: Comment[];
  hasMore: boolean;
};

export type InfiniteComments = {
  pages: CommentsResponse[];
  pageParams: unknown[];
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
