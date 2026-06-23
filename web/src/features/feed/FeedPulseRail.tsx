import { Camera, MapPin, MessageCircle, Radio, Vote } from 'lucide-react';
import { timeAgo } from '../../lib/format';
import { type Post } from '../../types';
import {
  getFeaturedFeedPost,
  getFeedPulseMetrics,
  getPostSignal,
} from './feed-presentation';

const formatRailTime = (value?: string): string => {
  const label = timeAgo(value);
  return label === 'Just now' ? label : `${label} ago`;
};

export const FeedPulseRail = ({
  onOpenPost,
  posts,
}: {
  onOpenPost: (postId: number) => void;
  posts: Post[];
}) => {
  const metrics = getFeedPulseMetrics(posts);
  const featuredPost = getFeaturedFeedPost(posts);
  const featuredSignal =
    featuredPost === undefined ? undefined : getPostSignal(featuredPost);
  const topPosts = posts
    .filter((post) => post.id !== featuredPost?.id)
    .slice(0, 3);

  return (
    <aside className="pulse-panel">
      <div className="pulse-meter">
        <Radio />
        <strong>{metrics.total}</strong>
        <span>{metrics.energyLabel} nearby</span>
      </div>
      <div className="mini-rule" />
      <div className="pulse-stat-row">
        <span>
          <MessageCircle />
          replies
        </span>
        <strong>{metrics.comments}</strong>
      </div>
      <div className="pulse-stat-row">
        <span>
          <Camera />
          photos
        </span>
        <strong>{metrics.photos}</strong>
      </div>
      <div className="pulse-stat-row">
        <span>
          <Vote />
          polls
        </span>
        <strong>{metrics.polls}</strong>
      </div>
      <div className="pulse-stat-row">
        <span>
          <MapPin />
          places
        </span>
        <strong>{metrics.places}</strong>
      </div>

      {featuredPost !== undefined && (
        <button
          className={`rail-featured is-${featuredSignal?.tone ?? 'seen'}`}
          onClick={() => onOpenPost(featuredPost.id)}
          type="button"
        >
          <span>{featuredSignal?.label ?? 'nearby'}</span>
          <strong>{featuredPost.title}</strong>
          <em>{formatRailTime(featuredPost.createdAt)}</em>
        </button>
      )}

      {topPosts.length > 0 && (
        <div className="rail-stack">
          {topPosts.map((post) => {
            const signal = getPostSignal(post);

            return (
              <button key={post.id} onClick={() => onOpenPost(post.id)} type="button">
                <span className={`ticker-signal is-${signal.tone}`}>{signal.label}</span>
                <strong>{post.title}</strong>
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
};
