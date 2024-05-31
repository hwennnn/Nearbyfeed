import type { AxiosError } from 'axios';
import { createQuery } from 'react-query-kit';

import { setUser, useUser } from '@/core/user';

import { client } from '../common';
import type { User } from '../types';

type Variables = {};
type Response = User;

export const useSelf = createQuery<Response, Variables, AxiosError>({
  primaryKey: 'self',
  queryFn: async ({ queryKey: [_primaryKey] }) => {
    const response = await client.get(`users/self`).catch((error) => {
      return Promise.reject(error);
    });

    return response.data;
  },
  initialData: () => {
    const userFromStorage = useUser.getState().user;

    if (userFromStorage !== null) {
      return userFromStorage;
    }
  },
  onSuccess: (data) => {
    setUser(data);
  },
});
