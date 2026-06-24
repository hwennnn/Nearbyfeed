import type { Post, User } from '../types';

export type OptimisticPostInput = {
  content?: string;
  latitude: number;
  longitude: number;
  title: string;
};

export const buildOptimisticPost = ({
  author,
  id,
  input,
}: {
  author: User;
  id: number;
  input: OptimisticPostInput;
}): Post => ({
  id,
  title: input.title,
  content: input.content,
  latitude: input.latitude,
  longitude: input.longitude,
  points: 0,
  isOptimistic: true,
  commentsCount: 0,
  author,
  authorId: author.id,
  poll: null,
});
