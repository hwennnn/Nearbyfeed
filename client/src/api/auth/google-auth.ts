import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import type { LoginResponse } from '@/api/types';

import { client } from '../common';

type Variables = { token: string };

export const useGoogleAuth = createMutation<
  LoginResponse,
  Variables,
  AxiosError
>(async (variables) =>
  client({
    url: `/auth/google/callback?token=${variables.token}`,
    method: 'POST',
  }).then((response) => response.data)
);
