import type { JwtPayload } from 'jwt-decode';
import jwtDecode from 'jwt-decode';

import { getItem, removeItem, setItem } from '@/core/storage';
import { timeUtils } from '@/utils/time-utils';

const ACCESS_TOKEN = 'access_token';
const REFRESH_TOKEN = 'refresh_token';

export type TokenType = {
  access: string;
  refresh: string;
};

export const getAccessToken = () => getItem<string | null>(ACCESS_TOKEN);
export const removeAccessToken = () => removeItem(ACCESS_TOKEN);
export const setAccessToken = (value: string) =>
  setItem<string>(ACCESS_TOKEN, value);

export const getRefreshToken = () => getItem<string | null>(REFRESH_TOKEN);
export const removeRefreshToken = () => removeItem(REFRESH_TOKEN);
export const setRefreshToken = (value: string) =>
  setItem<string>(REFRESH_TOKEN, value);

export const getTokens = (): TokenType | null => {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  if (accessToken === null || refreshToken === null) return null;

  return {
    access: accessToken,
    refresh: refreshToken,
  };
};
export const removeTokens = () => {
  removeAccessToken();
  removeRefreshToken();
};
export const setTokens = (token: TokenType) => {
  setAccessToken(token.access);
  setRefreshToken(token.refresh);
};

const isTokenExpired = (token: string): boolean => {
  const { exp } = jwtDecode<JwtPayload>(token);
  const currentTime = timeUtils.getCurrentTimeInMs();

  return exp === undefined || currentTime >= exp * 1000;
};

export const isRefreshingTokenRequired = (): boolean => {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  return (
    accessToken !== null &&
    isTokenExpired(accessToken) &&
    refreshToken !== null &&
    !isTokenExpired(refreshToken)
  );
};

export const checkAndClearExpiredToken = (): void => {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  const hasAllExpired =
    accessToken !== null &&
    isTokenExpired(accessToken) &&
    refreshToken !== null &&
    isTokenExpired(refreshToken);

  if (hasAllExpired) {
    removeTokens();
  }
};

export const decodeUidFromToken = (): string | null => {
  const accessToken = getAccessToken();

  if (accessToken === null) return null;

  const { sub } = jwtDecode<JwtPayload>(accessToken);

  return sub === undefined ? null : sub.toString();
};
