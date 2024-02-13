import { type Comment } from '@prisma/client';
import { type UserWithoutPassword } from 'src/users/entities';

export type CommentWithAuthor = Comment & {
  author: UserWithoutPassword;
  hasMore: boolean;
  childComments: CommentWithAuthor[];
};
