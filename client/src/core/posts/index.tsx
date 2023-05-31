import { create } from 'zustand';

import { createSelectors } from '../utils';

interface PostsQueryKey {
  latitude: number;
  longitude: number;
  distance: number;
}

interface PostsKeyState {
  postsQueryKey: PostsQueryKey | null;
  setPostsQueryKey: (data: PostsQueryKey) => void;
}

const _usePostsKey = create<PostsKeyState>((set, _get) => ({
  postsQueryKey: null,
  setPostsQueryKey: (data) => {
    set({
      postsQueryKey: data,
    });
  },
}));

export const usePostKeys = createSelectors(_usePostsKey);

export const setPostsQueryKey = (data: PostsQueryKey) =>
  _usePostsKey.getState().setPostsQueryKey(data);
