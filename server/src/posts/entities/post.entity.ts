import { type Post, type PostLike } from '@prisma/client';
import { type PollWithOptions } from 'src/posts/entities/poll.entity';
import { type UserWithoutPassword } from 'src/users/entities';

export type PostWithLike = Post & {
  like?: PostLike;
  author: UserWithoutPassword;
  poll: PollWithOptions | null;
};
