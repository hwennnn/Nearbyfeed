import axios from 'axios';

import { API_URL } from '@/api/types';
import { getItem, removeItem, setItem } from '@/core/storage';

const ACCESS_TOKEN = 'access_token';
const REFRESH_TOKEN = 'refresh_token';

export type AuthToken = {
  accessToken: string;
  refreshToken: string;
};

export const getAccessTokenFromStorage = () =>
  getItem<string | null>(ACCESS_TOKEN);
export const removeAccessTokenFromStorage = () => removeItem(ACCESS_TOKEN);
export const setAccessTokenIntoStorage = (value: string) =>
  setItem<string>(ACCESS_TOKEN, value);

export const getRefreshTokenFromStorage = () =>
  getItem<string | null>(REFRESH_TOKEN);
export const removeRefreshTokenFromStorage = () => removeItem(REFRESH_TOKEN);
export const setRefreshTokenIntoStorage = (value: string) =>
  setItem<string>(REFRESH_TOKEN, value);

export const getTokensFromStorage = (): AuthToken | null => {
  const accessToken = getAccessTokenFromStorage();
  const refreshToken = getRefreshTokenFromStorage();

  if (accessToken === null || refreshToken === null) return null;

  return {
    accessToken,
    refreshToken,
  };
};

export const removeTokensFromStorage = () => {
  removeAccessTokenFromStorage();
  removeRefreshTokenFromStorage();
};

export const setTokensIntoStorage = (token: AuthToken) => {
  setAccessTokenIntoStorage(token.accessToken);
  setRefreshTokenIntoStorage(token.refreshToken);
};

export const logoutUser = async () => {
  const refreshToken = getRefreshTokenFromStorage();

  if (refreshToken !== null) {
    // Bypass the axios interceptor
    await axios.post(
      `${API_URL}/auth/logout`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${refreshToken}`,
        },
      }
    );
  }
};
