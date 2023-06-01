import { type Comment, type User } from '@prisma/client';

export type CommentWithAuthor = Comment & {
  author: User;
};
