import type { AxiosError } from 'axios';
import { createInfiniteQuery } from 'react-query-kit';

import { client } from '../common';
import type { Post } from '../types';

type Response = {
  posts: Post[];
  hasMore: boolean;
};
type Variables = {
  latitude: number | null;
  longitude: number | null;
  distance: number;
};

export const usePosts = createInfiniteQuery<Response, Variables, AxiosError>(
  'posts', // we recommend using endpoint base url as primaryKey
  async ({ queryKey: [_primaryKey, variables], pageParam }) => {
    // in case if variables is needed, we can use destructuring to get it from queryKey array like this: ({ queryKey: [primaryKey, variables] })
    // primaryKey is 'posts' in this case

    const cursor = pageParam !== undefined ? pageParam.toString() : pageParam;

    const response = await client
      .get('posts', {
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
  {
    getNextPageParam: (lastPage, _) => {
      if (!lastPage.hasMore) return undefined;

      const { posts } = lastPage;
      const lastPost = posts[posts.length - 1];

      return lastPost.id;
    },
  }
);
