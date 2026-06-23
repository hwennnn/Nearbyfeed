import { type View } from '../app-types';
import { type Post } from '../types';

export const shouldClearStaleMapSelection = ({
  posts,
  selectedPostId,
  view,
}: {
  posts: Post[];
  selectedPostId: number | null;
  view: View;
}): boolean =>
  view === 'map' &&
  selectedPostId !== null &&
  !posts.some((post) => post.id === selectedPostId);
