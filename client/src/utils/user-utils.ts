import { fetchSelf } from '@/api/users/fetch-self';
import { setUser } from '@/core/user';

const hydrateUser = async () => {
  const user = await fetchSelf();
  setUser(user);
};

const userUtils = { hydrateUser };

export { userUtils };
