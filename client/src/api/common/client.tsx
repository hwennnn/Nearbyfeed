import { Env } from '@env';
import axios from 'axios';

import { signOut } from '@/core';
import {
  checkAndClearExpiredToken,
  getAccessToken,
  getRefreshToken,
  isRefreshingTokenRequired,
  setAccessToken,
} from '@/core/auth/utils';

const client = axios.create({
  baseURL: Env.API_URL,
  headers: { 'Content-Type': 'application/json' },
});

const refreshAuthToken = async (): Promise<void> => {
  console.log('refreshing token...');

  const refreshToken = getRefreshToken();

  if (refreshToken === null) return;

  const response = await axios.post(
    `${Env.API_URL}/auth/refresh-token`,
    {},
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${refreshToken}`,
      },
    }
  );
  const tokens = response.data;
  const access = tokens.accessToken;

  setAccessToken(access);
};

client.interceptors.request.use(
  async (config) => {
    checkAndClearExpiredToken();

    if (getAccessToken() !== null) {
      if (isRefreshingTokenRequired()) {
        await refreshAuthToken();
      }

      const newToken = getAccessToken();
      config.headers.Authorization = `Bearer ${newToken}`;
    }

    return config;
  },
  async (error) => {
    console.log('req error', error);
    return await Promise.reject(error.message);
  }
);

client.interceptors.response.use(
  async (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      signOut();
      console.log('res error : Session expired.');
      // could be showing popup alert -> your session has expired, please login to continue.
      const errorMessage =
        error.response?.data?.message ?? 'Session expired. User not authorized';
      return await Promise.reject(errorMessage);
    } else {
      console.log(
        'res error',
        error.response?.data?.message ?? 'Error happened. Please try again.'
      );
      return await Promise.reject(
        error.response?.data?.message ?? 'Error happened. Please try again.'
      );
    }
  }
);

export { client };
