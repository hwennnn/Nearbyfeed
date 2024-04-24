import type { AxiosError } from 'axios';
import { createInfiniteQuery } from 'react-query-kit';

import type { Comment } from '@/api/types';

import { client } from '../common';

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
>(
  'comments', // we recommend using endpoint base url as primaryKey
  async ({ queryKey: [primaryKey, variables], pageParam }) => {
    // in case if variables is needed, we can use destructuring to get it from queryKey array like this: ({ queryKey: [primaryKey, variables] })
    const cursor = pageParam !== undefined ? pageParam.toString() : pageParam;
    const response = await client
      .get(
        `posts/${variables.postId}/${primaryKey}/${variables.commentId}/replies`,
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
  {
    getNextPageParam: (lastPage, _) => {
      if (!lastPage.hasMore) return undefined;

      const { comments } = lastPage;
      const lastComment = comments[comments.length - 1];

      return lastComment.id;
    },
  }
);
