import { create } from 'zustand';

import { createSelectors } from '../utils';

export type CommentsSort = 'latest' | 'oldest' | 'top';

interface CommentsQueryKey {
  sort: CommentsSort;
}

interface CommentsKeyState {
  commentsQueryKey: CommentsQueryKey;
  setCommentsQueryKey: (data: CommentsQueryKey) => void;
}

const _useCommentsKey = create<CommentsKeyState>((set, _get) => ({
  commentsQueryKey: {
    sort: 'top',
  },
  setCommentsQueryKey: (data) => {
    set({
      commentsQueryKey: data,
    });
  },
}));

export const useCommentKeys = createSelectors(_useCommentsKey);

export const setCommentsQueryKey = (data: CommentsQueryKey) =>
  _useCommentsKey.getState().setCommentsQueryKey(data);
