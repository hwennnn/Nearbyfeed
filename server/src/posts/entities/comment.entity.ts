import { type Comment, type CommentLike } from '@prisma/client';
import { type UserWithoutPassword } from 'src/users/entities';

export type CommentWithLike = Comment & {
  like?: CommentLike;
  author: UserWithoutPassword;
};
