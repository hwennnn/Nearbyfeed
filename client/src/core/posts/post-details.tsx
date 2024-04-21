import { create } from 'zustand';

import { createSelectors } from '../utils';

export type CommentsSort = 'latest' | 'oldest';

interface PostDetails {
  commentsSort: CommentsSort;
}

interface PostDetailsState {
  postDetails: PostDetails | null;
  setPostDetails: (data: PostDetails) => void;
}

const _usePostDetails = create<PostDetailsState>((set, _get) => ({
  postDetails: {
    commentsSort: 'latest',
  },
  setPostDetails: (data) => {
    set({
      postDetails: data,
    });
  },
}));

export const usePostDetails = createSelectors(_usePostDetails);

export const setPostDetails = (data: PostDetails) => {
  _usePostDetails.getState().setPostDetails(data);
};
