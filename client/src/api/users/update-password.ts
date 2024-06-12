import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client } from '../common';

type Variables = {
  originalPassword: string;
  newPassword: string;
  userId: number;
};
type Response = {};

export const useUpdatePassword = createMutation<
  Response,
  Variables,
  AxiosError
>({
  mutationFn: async (variables) =>
    client({
      url: `users/${variables.userId}/update-password`,
      method: 'PATCH',
      data: variables,
    }).then((response) => response.data),
});
