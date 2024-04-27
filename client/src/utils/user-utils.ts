import { fetchSelf } from '@/api/users/fetch-self';
import { isRefreshTokenEmpty } from '@/core/auth/utils';
import { setUser } from '@/core/user';

const hydrateUser = async () => {
  if (!isRefreshTokenEmpty()) {
    const user = await fetchSelf();
    setUser(user);
  }
};

const userUtils = { hydrateUser };

export { userUtils };
