import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { type User } from '@/api';
import { zustandStorage } from '@/core/storage';

import { createSelectors } from '../utils';

interface UserState {
  user: User | null;
  setUser: (user: User) => void;
  resetUser: () => void;
}

const _useUser = create<UserState>()(
  persist(
    (set, _get) => ({
      user: null,
      setUser: (user) => {
        set({ user });
      },
      resetUser: () => {
        set({ user: null });
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);

export const useUser = createSelectors(_useUser);

export const setUser = (user: User) => _useUser.getState().setUser(user);
export const resetUser = () => _useUser.getState().resetUser();
