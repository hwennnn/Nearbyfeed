import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client } from '../common';

type Variables = { username: string; email: string; password: string };
type PendingUser = {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
};
type RegisterResponse = {
  pendingUser: PendingUser;
  sessionId: string;
};

export const useRegister = createMutation<
  RegisterResponse,
  Variables,
  AxiosError
>({
  mutationFn: async (variables) =>
    client({
      url: '/auth/register',
      method: 'POST',
      data: variables,
    }).then((response) => response.data),
});
