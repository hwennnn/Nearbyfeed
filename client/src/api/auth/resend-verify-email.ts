import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client } from '../common';

type Variables = { pendingUserId: string };

type Response = {
  sessionId: string;
};

export const useResendVerifyEmail = createMutation<
  Response,
  Variables,
  AxiosError
>(async (variables) =>
  client({
    url: `/auth/verify-email/${variables.pendingUserId}/resend`,
    method: 'POST',
  }).then((response) => response.data)
);
