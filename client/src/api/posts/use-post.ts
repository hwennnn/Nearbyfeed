import type { AxiosError } from 'axios';
import { createQuery } from 'react-query-kit';

import { client } from '../common';
import type { Post } from '../types';

type Variables = { id: number };
type Response = Post;

export const usePost = createQuery<Response, Variables, AxiosError>(
  'posts',
  async ({ queryKey: [primaryKey, variables] }) => {
    const response = await client
      .get(`${primaryKey}/${variables.id}`)
      .catch((error) => {
        return Promise.reject(error);
      });
    return response.data;
  }
);
