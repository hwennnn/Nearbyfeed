import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client } from '../common';

type Variables = { email: string };
type Response = {};

export const useForgotPassword = createMutation<
  Response,
  Variables,
  AxiosError
>({
  mutationFn: async (variables) =>
    client({
      url: '/auth/password/forgot',
      method: 'POST',
      data: variables,
    }).then((response) => response.data),
});
