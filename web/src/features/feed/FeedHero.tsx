import { type DistanceMeters } from '@nearbyfeed/shared';
import { ArrowUpRight, Radio, RefreshCw, Sparkles } from 'lucide-react';
import { formatDistance, timeAgo } from '../../lib/format';
import { type Post } from '../../types';
import {
  getFeaturedFeedPost,
  getFeedHeroSummary,
  getFeedPulseMetrics,
  getPostSignal,
} from './feed-presentation';

export const FeedHero = ({
  distance,
  locationName,
  onOpenPost,
  posts,
  refreshPosts,
}: {
  distance: DistanceMeters;
  locationName: string;
  onOpenPost: (postId: number) => void;
  posts: Post[];
  refreshPosts: () => void;
}) => {
  const metrics = getFeedPulseMetrics(posts);
  const featuredPost = getFeaturedFeedPost(posts);
  const featuredSignal =
    featuredPost === undefined ? undefined : getPostSignal(featuredPost);

  return (
    <section className="feed-hero">
      <div className="feed-hero-main">
        <span className="feed-hero-kicker">
          <Radio />
          {metrics.energyLabel} within {formatDistance(distance)}
        </span>
        <h1>{locationName}</h1>
        <p>{getFeedHeroSummary(metrics)}</p>
        <div className="feed-hero-actions">
          <button className="primary-button" onClick={refreshPosts} type="button">
            <RefreshCw />
            Refresh feed
          </button>
          {featuredPost !== undefined && (
            <button
              className="text-command"
              onClick={() => onOpenPost(featuredPost.id)}
              type="button"
            >
              Open top post
              <ArrowUpRight />
            </button>
          )}
        </div>
      </div>

      <button
        className="feed-featured-card"
        disabled={featuredPost === undefined}
        onClick={() => {
          if (featuredPost !== undefined) onOpenPost(featuredPost.id);
        }}
        type="button"
      >
        <span className="featured-card-glow" />
        <span className="featured-card-kicker">
          <Sparkles />
          {featuredSignal?.label ?? 'ready'}
        </span>
        <strong>{featuredPost?.title ?? 'No posts nearby yet'}</strong>
        <em>
          {featuredPost === undefined
            ? 'Waiting for the first nearby post.'
            : `${timeAgo(featuredPost.createdAt)} · ${
                featuredPost.locationName ?? 'nearby'
              }`}
        </em>
      </button>
    </section>
  );
};
