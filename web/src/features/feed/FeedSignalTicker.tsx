import { Activity, MapPin } from 'lucide-react';
import { timeAgo } from '../../lib/format';
import { type Post } from '../../types';
import { getPostSignal } from './feed-presentation';

export const FeedSignalTicker = ({
  onOpenPost,
  posts,
}: {
  onOpenPost: (postId: number) => void;
  posts: Post[];
}) => {
  const tickerPosts = posts.slice(0, 4);

  if (tickerPosts.length === 0) return null;

  return (
    <div className="feed-signal-ticker" aria-label="Nearby pulse">
      <div className="ticker-label">
        <Activity />
        <span>live nearby</span>
      </div>
      <div className="ticker-track">
        {tickerPosts.map((post) => {
          const signal = getPostSignal(post);

          return (
            <button key={post.id} onClick={() => onOpenPost(post.id)} type="button">
              <span className={`ticker-signal is-${signal.tone}`}>{signal.label}</span>
              <strong>{post.title}</strong>
              <em>
                <MapPin />
                {post.locationName ?? 'nearby'} · {timeAgo(post.createdAt)}
              </em>
            </button>
          );
        })}
      </div>
    </div>
  );
};
