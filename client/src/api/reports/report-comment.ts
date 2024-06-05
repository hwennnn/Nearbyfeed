import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client } from '../common';
import type { ReportReason } from '../types';

type Variables = {
  commentId: string;
  reason: ReportReason;
};
type Context = {};

export const useReportComment = createMutation<
  Response,
  Variables,
  AxiosError,
  Context
>({
  mutationFn: async (variables) => {
    const response = await client
      .post('reports/comments', variables)
      .catch((error) => {
        return Promise.reject(error);
      });

    return response.data;
  },
});
