import { Env } from '@env';
import axios from 'axios';
import { Alert } from 'react-native';

import { signOut } from '@/core/auth';
import {
  getAccessToken,
  getRefreshToken,
  isRefreshTokenEmpty,
  setAccessToken,
} from '@/core/auth/utils';
import { resetUser } from '@/core/user';

const client = axios.create({
  baseURL: Env.API_URL,
  headers: { 'Content-Type': 'application/json' },
});

const refreshAuthToken = async (): Promise<void> => {
  console.log('refreshing token...');

  const refreshToken = getRefreshToken();

  if (refreshToken === null) return;

  try {
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
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error('There was an error when refreshing the token');
      Alert.alert('You have been signed out');
      signOut();
      resetUser();
    }
  }
};

client.interceptors.request.use(
  async (config) => {
    const newToken = getAccessToken();

    if (newToken !== null) {
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
    const originalRequest = error.config;

    if (error.response?.status === 401) {
      if (!isRefreshTokenEmpty()) {
        await refreshAuthToken();

        const newToken = getAccessToken();

        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return axios(originalRequest);
      } else {
        Alert.alert('You have been signed out');
        signOut();
        resetUser();
        console.log('res error : Session expired.');
        // could be showing popup alert -> your session has expired, please login to continue.
        const errorMessage =
          error.response?.data?.message ??
          'Session expired. User not authorized';
        return await Promise.reject(errorMessage);
      }
    } else {
      console.error(
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
