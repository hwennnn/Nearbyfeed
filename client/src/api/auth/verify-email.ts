import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client } from '../common';
import type { LoginResponse } from '../types';

type Variables = { pendingUserId: string; sessionId: string; otpCode: string };

export const useVerifyEmail = createMutation<
  LoginResponse,
  Variables,
  AxiosError
>({
  mutationFn: async (variables) =>
    client({
      url: `/auth/verify-email/${variables.pendingUserId}`,
      method: 'POST',
      data: {
        sessionId: variables.sessionId,
        otpCode: variables.otpCode,
      },
    }).then((response) => response.data),
});
