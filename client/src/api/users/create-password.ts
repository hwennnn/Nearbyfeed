import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client } from '../common';

type Variables = {
  password: string;
  userId: number;
};
type Response = {};

export const useCreatePassword = createMutation<
  Response,
  Variables,
  AxiosError
>({
  mutationFn: async (variables) =>
    client({
      url: `users/${variables.userId}/create-password`,
      method: 'PATCH',
      data: variables,
    }).then((response) => response.data),
});
