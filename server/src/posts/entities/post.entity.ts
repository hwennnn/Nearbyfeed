import { type Post, type Updoot, type User } from '@prisma/client';

export type PostWithUpdoot = Post & {
  updoot?: Updoot;
  author: User;
};
