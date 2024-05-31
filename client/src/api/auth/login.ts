import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client } from '../common';
import type { LoginResponse } from '../types';

type Variables = { email: string; password: string };

export const useLogin = createMutation<LoginResponse, Variables, AxiosError>({
  mutationFn: async (variables) =>
    client({
      url: '/auth/login',
      method: 'POST',
      data: variables,
    }).then((response) => response.data),
});
