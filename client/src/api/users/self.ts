import type { AxiosError } from 'axios';
import { createQuery } from 'react-query-kit';

import type { User } from '@/api/posts';

import { client } from '../common';

type Variables = {};
type Response = User;

export const useSelf = createQuery<Response, Variables, AxiosError>(
  'self',
  async ({ queryKey: [_primaryKey] }) => {
    const response = await client.get(`users/self`).catch((error) => {
      return Promise.reject(error);
    });

    return response.data;
  }
);
