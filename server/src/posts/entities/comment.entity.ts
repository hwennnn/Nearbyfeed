import { type Comment, type Updoot, type User } from '@prisma/client';

export type CommentWithAuthor = Comment & {
  updoot?: Updoot[];
  author: User;
};
