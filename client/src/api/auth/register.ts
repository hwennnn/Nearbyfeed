import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client } from '../common';

type Variables = { username: string; email: string; password: string };
type Response = { accessToken: string; refreshToken: string };

export const useRegister = createMutation<Response, Variables, AxiosError>(
  async (variables) =>
    client({
      url: '/auth/register',
      method: 'POST',
      data: variables,
    }).then((response) => response.data)
);
