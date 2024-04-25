import { Env } from '@env';

import { client } from '@/api/common';
import type { User } from '@/api/types';

export const fetchSelf = async (): Promise<User> => {
  const response = await client.get(`${Env.API_URL}/users/self`);

  const user = response.data;

  return user;
};
