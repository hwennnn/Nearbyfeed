import { create } from 'zustand';

import type { AuthToken } from '@/core/auth/utils';
import {
  getTokensFromStorage,
  removeTokensFromStorage,
  setTokensIntoStorage,
} from '@/core/auth/utils';
import { resetUser } from '@/core/user';

import { createSelectors } from '../utils';

interface AuthState {
  token: AuthToken | null;
  status: 'idle' | 'signOut' | 'signIn';
  signIn: (data: AuthToken, shouldUpdateToken?: boolean) => void;
  signOut: () => void;
  hydrate: () => void;
  updateToken: (data: AuthToken) => void;
}

const _useAuth = create<AuthState>((set, get) => ({
  status: 'idle',
  token: null,
  signIn: (token, shouldUpdateToken = true) => {
    console.log('🚀 ~ shouldUpdateToken:', shouldUpdateToken);

    if (shouldUpdateToken) {
      setTokensIntoStorage(token);
    }

    set({ status: 'signIn', token });
  },
  signOut: () => {
    removeTokensFromStorage();
    set({ status: 'signOut', token: null });
    resetUser();
  },
  hydrate: async () => {
    try {
      const userToken = getTokensFromStorage();
      if (userToken !== null) {
        get().signIn(userToken, false);
      } else {
        get().signOut();
      }
    } catch (e) {
      // catch error here
      // Maybe sign_out user!
      get().signOut();
    }
  },
  updateToken: (data: AuthToken) => {
    setTokensIntoStorage(data);
    set({ token: data });
  },
}));

export const useAuth = createSelectors(_useAuth);

export const getAuthToken = () => _useAuth.getState().token;
export const getAccessToken = () => _useAuth.getState().token?.accessToken;
export const getRefreshToken = () => _useAuth.getState().token?.refreshToken;

export const signOut = () => _useAuth.getState().signOut();
export const signIn = (token: AuthToken) => _useAuth.getState().signIn(token);
export const hydrateAuth = () => _useAuth.getState().hydrate();
export const updateToken = (token: AuthToken) =>
  _useAuth.getState().updateToken(token);
