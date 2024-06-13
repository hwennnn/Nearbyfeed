import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client, queryClient } from '../common';

type Variables = {
  originalPassword: string;
  newPassword: string;
};
type Response = {};

export const useUpdatePassword = createMutation<
  Response,
  Variables,
  AxiosError
>({
  mutationFn: async (variables) =>
    client({
      url: `auth/password`,
      method: 'PUT',
      data: variables,
    }).then((response) => response.data),
  onSuccess: (_) => {
    queryClient.invalidateQueries(['self']);
  },
});
