import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import type { LoginResponse } from '@/api/auth/login';

import { client } from '../common';

type Variables = { pendingUserId: string; sessionId: string; otpCode: string };

export const useVerifyEmail = createMutation<
  LoginResponse,
  Variables,
  AxiosError
>(async (variables) =>
  client({
    url: `/auth/verify-email/${variables.pendingUserId}`,
    method: 'POST',
    data: {
      sessionId: variables.sessionId,
      otpCode: variables.otpCode,
    },
  }).then((response) => response.data)
);
