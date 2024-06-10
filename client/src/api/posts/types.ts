import type { Post } from '../types';

export type PostsResponse = {
  posts: Post[];
  hasMore: boolean;
};

export type InfinitePosts = {
  pages: PostsResponse[];
  pageParams: unknown[];
};
