import { type Post, type PostLike, type User } from '@prisma/client';

export type PostWithLike = Post & {
  like?: PostLike;
  author: User;
};
