import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client, queryClient } from '../common';

type Variables = {
  userId: number;
  blockedId: number;
};
type Context = {};

export const useBlockUser = createMutation<
  Response,
  Variables,
  AxiosError,
  Context
>({
  mutationFn: async (variables) => {
    const response = await client
      .post(`users/${variables.userId}/block/${variables.blockedId}`)
      .catch((error) => {
        return Promise.reject(error);
      });

    return response.data;
  },
  onSettled: (_) => {
    queryClient.invalidateQueries(['self']);
  },
});
