import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client } from '../common';

type Variables = { email: string; password: string };
type Response = { accessToken: string; refreshToken: string };

export const useLogin = createMutation<Response, Variables, AxiosError>(
  async (variables) =>
    client({
      url: '/auth/login',
      method: 'POST',
      data: variables,
    }).then((response) => response.data)
);
