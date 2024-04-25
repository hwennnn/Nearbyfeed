import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import type { User } from '@/api/types';

import { client } from '../common';

type AuthToken = {
  accessToken: string;
  refreshToken: string;
};

type Variables = { email: string; password: string };
export type LoginResponse = { tokens: AuthToken; user: User };

export const useLogin = createMutation<LoginResponse, Variables, AxiosError>(
  async (variables) =>
    client({
      url: '/auth/login',
      method: 'POST',
      data: variables,
    }).then((response) => response.data)
);
