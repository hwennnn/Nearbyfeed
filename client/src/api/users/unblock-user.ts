import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client } from '../common';

type Variables = {
  userId: number;
  blockedId: number;
};
type Context = {};

export const useUnblockUser = createMutation<
  Response,
  Variables,
  AxiosError,
  Context
>({
  mutationFn: async (variables) => {
    const response = await client
      .delete(`users/${variables.userId}/block/${variables.blockedId}`)
      .catch((error) => {
        return Promise.reject(error);
      });

    return response.data;
  },
});
