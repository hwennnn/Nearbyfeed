import { type Post, type Updoot } from '@prisma/client';

export type PostWithUpdoot = Post & {
  updoot?: Updoot[];
};
