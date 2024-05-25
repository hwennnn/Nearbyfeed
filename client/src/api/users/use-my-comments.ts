import type { AxiosError } from 'axios';
import { createInfiniteQuery } from 'react-query-kit';

import { useUser } from '@/core/user';

import { client } from '../common';
import type { CommentWithPost } from '../types';

type Response = {
  comments: CommentWithPost[];
  hasMore: boolean;
};
type Variables = {};

export const useMyComments = createInfiniteQuery<
  Response,
  Variables,
  AxiosError
>(
  'my-comments', // we recommend using endpoint base url as primaryKey
  async ({ queryKey: [_primaryKey], pageParam }) => {
    // in case if variables is needed, we can use destructuring to get it from queryKey array like this: ({ queryKey: [primaryKey, variables] })

    const cursor = pageParam !== undefined ? pageParam.toString() : pageParam;

    const userId = useUser.getState().user?.id;

    const response = await client
      .get(`users/${userId}/comments`, {
        params: {
          cursor,
        },
      })
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
