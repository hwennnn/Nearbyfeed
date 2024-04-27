import { create } from 'zustand';

import type { AuthToken } from '@/core/auth/utils';
import { getTokens, removeTokens, setTokens } from '@/core/auth/utils';

import { createSelectors } from '../utils';

interface AuthState {
  token: AuthToken | null;
  status: 'idle' | 'signOut' | 'signIn';
  signIn: (data: AuthToken) => void;
  signOut: () => void;
  hydrate: () => void;
}

const _useAuth = create<AuthState>((set, get) => ({
  status: 'idle',
  token: null,
  signIn: (token) => {
    setTokens(token);
    set({ status: 'signIn', token });
  },
  signOut: () => {
    removeTokens();
    set({ status: 'signOut', token: null });
  },
  hydrate: async () => {
    try {
      const userToken = getTokens();
      if (userToken !== null) {
        get().signIn(userToken);
      } else {
        get().signOut();
      }
    } catch (e) {
      // catch error here
      // Maybe sign_out user!
      get().signOut();
    }
  },
}));

export const useAuth = createSelectors(_useAuth);

export const signOut = () => _useAuth.getState().signOut();
export const signIn = (token: AuthToken) => _useAuth.getState().signIn(token);
export const hydrateAuth = () => _useAuth.getState().hydrate();
