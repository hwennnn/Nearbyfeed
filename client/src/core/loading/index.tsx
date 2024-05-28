import { create } from 'zustand';

import { createSelectors } from '../utils';

export interface LoadingState {
  isAppLoading: boolean;
  loadingText?: string;
}

interface AppLoadingState {
  isAppLoading: boolean;
  loadingText?: string;
  setAppLoading: (loadingState: boolean, loadingText?: string) => void;
}

const _useGlobaLoading = create<AppLoadingState>((set, _get) => ({
  isAppLoading: false,
  loadingText: undefined,
  setAppLoading: (loadingState, loadingText) => {
    set({
      isAppLoading: loadingState,
      loadingText,
    });
  },
}));

export const useAppLoading = createSelectors(_useGlobaLoading);

export const getAppLoadingState = (): LoadingState => {
  return {
    isAppLoading: _useGlobaLoading.getState().isAppLoading,
    loadingText: _useGlobaLoading.getState().loadingText,
  };
};
export const setAppLoading = (loadingState: boolean, loadingText?: string) =>
  _useGlobaLoading.getState().setAppLoading(loadingState, loadingText);
