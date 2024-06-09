import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { usePostKeys } from '@/core/posts';

import { client, queryClient } from '../common';

type Variables = {
  postId: number;
};
type Response = {};
type Context = {};

export const useDeletePost = createMutation<
  Response,
  Variables,
  AxiosError,
  Context
>({
  mutationFn: async (variables) => {
    const response = await client({
      url: `posts/${variables.postId}`,
      method: 'DELETE',
    }).catch((error) => {
      return Promise.reject(error);
    });

    return response.data;
  },
  onSuccess: (_data, _variables, _context) => {
    const queryKey = ['posts', usePostKeys.getState().postsQueryKey];
    queryClient.invalidateQueries(queryKey);

    const myPostsQueryKey = ['my-posts', {}];
    queryClient.invalidateQueries(myPostsQueryKey);
  },
});
