import { API_URL, client } from '@/api/common';
import type { User } from '@/api/types';

export const fetchSelf = async (): Promise<User> => {
  const response = await client.get(`${API_URL}/users/self`);

  const user = response.data;

  return user;
};
