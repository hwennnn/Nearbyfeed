import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client } from '../common';

type Variables = { username: string; email: string; password: string };
type Response = {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
};

export const useRegister = createMutation<Response, Variables, AxiosError>(
  async (variables) =>
    client({
      url: '/auth/register',
      method: 'POST',
      data: variables,
    }).then((response) => response.data)
);
