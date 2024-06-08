import axios from 'axios';

import {
  getAccessToken,
  getRefreshToken,
  signOut,
  updateToken,
} from '@/core/auth';

import { API_URL } from '../types';

const client = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

const refreshAuthToken = async (): Promise<void> => {
  const refreshToken = getRefreshToken();

  console.log('refreshing token...');

  if (refreshToken === null) return;

  try {
    const response = await axios.post(
      `${API_URL}/auth/refresh-token`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${refreshToken}`,
        },
      }
    );

    const tokens = response.data;
    updateToken(tokens);
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error('There was an error when refreshing the token');
      signOut(true);
    }
  }
};

client.interceptors.request.use(
  async (config) => {
    const accessToken = getAccessToken();

    if (accessToken !== null) {
      config.headers.Authorization = `Bearer ${accessToken}`;
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
      if (getRefreshToken() !== undefined) {
        await refreshAuthToken();

        const newToken = getAccessToken();

        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return axios(originalRequest);
      } else {
        signOut(true);
        console.log('res error : Session expired.');
        // could be showing popup alert -> your session has expired, please login to continue.
        const errorMessage =
          error.response?.data?.message ??
          'Session expired. User not authorized';
        return await Promise.reject(errorMessage);
      }
    } else {
      console.error('res error', error.toJSON().message);
      return await Promise.reject(
        error.response?.data?.message ?? 'Error happened. Please try again.'
      );
    }
  }
);

export { client };
