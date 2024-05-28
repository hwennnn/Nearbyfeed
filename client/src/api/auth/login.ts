import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import type { LoginResponse } from '@/api/types';

import { client } from '../common';

type Variables = { email: string; password: string };

export const useLogin = createMutation<LoginResponse, Variables, AxiosError>(
  async (variables) =>
    client({
      url: '/auth/login',
      method: 'POST',
      data: variables,
    }).then((response) => response.data)
);
