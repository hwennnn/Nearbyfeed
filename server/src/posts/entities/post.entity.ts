import { type Post, type PostLike } from '@prisma/client';
import { type UserWithoutPassword } from 'src/users/entities';

export type PostWithLike = Post & {
  like?: PostLike;
  author: UserWithoutPassword;
};
