import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client, queryClient } from '../common';

type Variables = {
  password: string;
};
type Response = {};

export const useCreatePassword = createMutation<
  Response,
  Variables,
  AxiosError
>({
  mutationFn: async (variables) =>
    client({
      url: `auth/password`,
      method: 'POST',
      data: variables,
    }).then((response) => response.data),
  onSuccess: (_) => {
    queryClient.invalidateQueries(['self']);
  },
});
