import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client } from '../common';

type Variables = {
  providerName: 'email' | 'google' | 'apple';
};
type Response = {};

export const useDisconnectProvider = createMutation<
  Response,
  Variables,
  AxiosError
>({
  mutationFn: async (variables) =>
    client({
      url: `auth/providers/${variables.providerName}`,
      method: 'DELETE',
      data: variables,
    }).then((response) => response.data),
});
