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
  sort: 'latest' | 'oldest' | 'top';
};

export const useComments = createInfiniteQuery<Response, Variables, AxiosError>(
  {
    primaryKey: 'comments',
    queryFn: async ({ queryKey: [primaryKey, variables], pageParam }) => {
      // in case if variables is needed, we can use destructuring to get it from queryKey array like this: ({ queryKey: [primaryKey, variables] })
      // primaryKey is 'comments' in this case
      const cursor = pageParam !== undefined ? pageParam.toString() : pageParam;

      const response = await client
        .get(`posts/${variables.postId}/${primaryKey}`, {
          params: {
            ...variables,
            cursor,
          },
        })
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
  }
);
