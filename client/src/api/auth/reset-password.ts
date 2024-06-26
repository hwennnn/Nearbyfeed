import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client } from '../common';

type Variables = { token: string; newPassword: string };
type Response = {};

export const useResetPassword = createMutation<Response, Variables, AxiosError>(
  {
    mutationFn: async (variables) =>
      client({
        url: '/auth/password/reset',
        method: 'PUT',
        data: variables,
      }).then((response) => response.data),
  }
);
