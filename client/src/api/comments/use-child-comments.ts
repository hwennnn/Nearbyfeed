import type { AxiosError } from 'axios';
import { createInfiniteQuery } from 'react-query-kit';

import { client } from '../common';
import type { Comment } from '../types';

type Response = {
  comments: Comment[];
  hasMore: boolean;
};
type Variables = {
  postId: number;
  commentId: number;
};

export const useChildComments = createInfiniteQuery<
  Response,
  Variables,
  AxiosError
>({
  primaryKey: 'child-comments',
  queryFn: async ({ queryKey: [_primaryKey, variables], pageParam }) => {
    // in case if variables is needed, we can use destructuring to get it from queryKey array like this: ({ queryKey: [primaryKey, variables] })
    const cursor = pageParam !== undefined ? pageParam.toString() : pageParam;
    const response = await client
      .get(
        `posts/${variables.postId}/comments/${variables.commentId}/replies`,
        {
          params: {
            ...variables,
            cursor,
          },
        }
      )
      .catch((error) => {
        return Promise.reject(error);
      });

    return response.data;
  },
  getNextPageParam: (lastPage, _) => {
    if (!lastPage.hasMore) return undefined;

    const { comments } = lastPage;
    const lastComment = comments[comments.length - 1];

    return lastComment.id;
  },
});
