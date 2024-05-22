import { fetchSelf } from '@/api/users/fetch-self';
import { getRefreshToken } from '@/core';
import { setUser } from '@/core/user';

const hydrateUser = async () => {
  if (getRefreshToken() !== undefined) {
    const user = await fetchSelf();
    setUser(user);
  }
};

const userUtils = { hydrateUser };

export { userUtils };
