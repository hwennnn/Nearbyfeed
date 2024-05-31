import type { AxiosError } from 'axios';
import { createQuery } from 'react-query-kit';

import { client } from '../common';
import type { Comment } from '../types';

type Variables = { postId: number; commentId: number };
type Response = Comment;

export const useComment = createQuery<Response, Variables, AxiosError>({
  primaryKey: 'comments',
  queryFn: async ({ queryKey: [primaryKey, variables] }) => {
    const response = await client
      .get(`posts/${variables.postId}/${primaryKey}/${variables.commentId}`)
      .catch((error) => {
        return Promise.reject(error);
      });
    return response.data;
  },
});
