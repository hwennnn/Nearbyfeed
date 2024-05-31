import { client } from '../common';
import { API_URL, type User } from '../types';

export const fetchSelf = async (): Promise<User> => {
  const response = await client.get(`${API_URL}/users/self`);

  const user = response.data;

  return user;
};
