import { NativeWindStyleSheet } from 'nativewind';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from '../storage';
import { createSelectors } from '../utils';

export type ColorSchemeTheme = 'light' | 'dark' | 'system';
export type ColorSchemeType = 'light' | 'dark';

interface ThemeState {
  colorSchemeTheme: ColorSchemeTheme;
  colorScheme: ColorSchemeType;
  systemColorScheme: ColorSchemeType;
  hydrateTheme: () => void;
  setTheme: (t: ColorSchemeTheme) => void;
  setSystemColorScheme: (t: ColorSchemeType) => void;
}

const _useTheme = create<ThemeState>()(
  persist(
    (set, get) => ({
      colorSchemeTheme: 'system',
      colorScheme: 'dark',
      systemColorScheme: 'dark',
      hydrateTheme: () => {
        const theme = get().colorSchemeTheme;
        if (theme === 'system') {
          const systemColorScheme = get().systemColorScheme;
          NativeWindStyleSheet.setColorScheme(systemColorScheme);
        } else {
          const colorScheme = get().colorScheme;
          NativeWindStyleSheet.setColorScheme(colorScheme);
        }
      },
      setTheme: (t) => {
        if (t === 'system') {
          const systemTheme = get().systemColorScheme;
          set({ colorSchemeTheme: t, colorScheme: systemTheme });
          NativeWindStyleSheet.setColorScheme(systemTheme as ColorSchemeTheme);
        } else {
          set({ colorSchemeTheme: t, colorScheme: t });
          NativeWindStyleSheet.setColorScheme(t as ColorSchemeTheme);
        }
      },
      setSystemColorScheme: (t) => {
        const theme = get().colorSchemeTheme;
        if (theme === 'system') {
          set({ systemColorScheme: t, colorScheme: t });
          NativeWindStyleSheet.setColorScheme(t as ColorSchemeTheme);
        } else {
          set({ systemColorScheme: t });
        }
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);

export const useTheme = createSelectors(_useTheme);

export const hydrateTheme = () => _useTheme.getState().hydrateTheme();
export const setTheme = (t: ColorSchemeTheme) =>
  _useTheme.getState().setTheme(t);
export const setSystemColorScheme = (t: ColorSchemeType) =>
  _useTheme.getState().setSystemColorScheme(t);
