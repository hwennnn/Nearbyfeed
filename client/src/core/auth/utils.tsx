import { getItem, removeItem, setItem } from '@/core/storage';

const ACCESS_TOKEN = 'access_token';
const REFRESH_TOKEN = 'refresh_token';

export type AuthToken = {
  accessToken: string;
  refreshToken: string;
};

export const getAccessToken = () => getItem<string | null>(ACCESS_TOKEN);
export const removeAccessToken = () => removeItem(ACCESS_TOKEN);
export const setAccessToken = (value: string) =>
  setItem<string>(ACCESS_TOKEN, value);

export const getRefreshToken = () => getItem<string | null>(REFRESH_TOKEN);
export const removeRefreshToken = () => removeItem(REFRESH_TOKEN);
export const setRefreshToken = (value: string) =>
  setItem<string>(REFRESH_TOKEN, value);

export const getTokens = (): AuthToken | null => {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  if (accessToken === null || refreshToken === null) return null;

  return {
    accessToken,
    refreshToken,
  };
};
export const removeTokens = () => {
  removeAccessToken();
  removeRefreshToken();
};
export const setTokens = (token: AuthToken) => {
  setAccessToken(token.accessToken);
  setRefreshToken(token.refreshToken);
};

export const isRefreshTokenEmpty = (): boolean => {
  return getRefreshToken() === null;
};
