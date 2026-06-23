import { type Post, type Session } from '../../types';
import { FeedCard } from './FeedCard';
import { FeedPaginationControl } from './FeedPaginationControl';
import { type FeedAuthIntent } from './feed-auth';

export const FeedPostStack = ({
  hasMorePosts,
  isFetchingMorePosts,
  onLoadMore,
  onOpenPost,
  onRequireAuth,
  posts,
  session,
}: {
  hasMorePosts: boolean;
  isFetchingMorePosts: boolean;
  onLoadMore: () => void;
  onOpenPost: (postId: number) => void;
  onRequireAuth: (intent: FeedAuthIntent) => void;
  posts: Post[];
  session: Session | null;
}) => (
  <>
    <div className="post-stack">
      {posts.map((post) => (
        <FeedCard
          key={post.id}
          onOpen={() => onOpenPost(post.id)}
          onRequireAuth={onRequireAuth}
          post={post}
          session={session}
        />
      ))}
    </div>
    <FeedPaginationControl
      hasMorePosts={hasMorePosts}
      isFetchingMorePosts={isFetchingMorePosts}
      onLoadMore={onLoadMore}
    />
  </>
);
