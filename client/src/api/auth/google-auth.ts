import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client } from '../common';
import type { LoginResponse } from '../types';

type Variables = { token: string };

export const useGoogleAuth = createMutation<
  LoginResponse,
  Variables,
  AxiosError
>({
  mutationFn: async (variables) =>
    client({
      url: `/auth/google/callback?token=${variables.token}`,
      method: 'POST',
    }).then((response) => {
      return response.data;
    }),
});
