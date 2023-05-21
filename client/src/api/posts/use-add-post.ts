import type { AxiosError } from 'axios';
import { createMutation } from 'react-query-kit';

import { client } from '../common';
import type { Post } from './types';

type Variables = {
  title: string;
  content: string;
  latitude: number;
  longitude: number;
};
type Response = Post;

export const useAddPost = createMutation<Response, Variables, AxiosError>({
  mutationFn: async (variables) =>
    client({
      url: 'posts',
      method: 'POST',
      data: variables,
    })
      .then((response) => response.data)
      .catch((error) => {
        return Promise.reject(error);
      }),
});
