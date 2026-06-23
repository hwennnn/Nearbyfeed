import { ArrowUpRight, Camera, MessageCircle, Sparkles, Vote } from 'lucide-react';
import { type Post } from '../../types';
import {
  getFeedLiveLensHeading,
  getFeedLiveLensItems,
  getFeedPulseMetrics,
} from './feed-presentation';

const MAX_LENS_SCORE = 180;

export const FeedLiveLens = ({
  onOpenPost,
  posts,
}: {
  onOpenPost: (postId: number) => void;
  posts: Post[];
}) => {
  const metrics = getFeedPulseMetrics(posts);
  const items = getFeedLiveLensItems(posts);
  const heatPercent = Math.min(
    100,
    Math.round((metrics.score / MAX_LENS_SCORE) * 100),
  );

  return (
    <section className="feed-live-lens" aria-label="Nearby live lens">
      <div className="lens-score-card">
        <span className="lens-kicker">
          <Sparkles />
          live lens
        </span>
        <strong>{metrics.score}</strong>
        <p>{metrics.energyLabel} pulse near you</p>
        <span className="lens-heat-track" aria-hidden="true">
          <span style={{ width: `${heatPercent}%` }} />
        </span>
      </div>

      <div className="lens-story-stage">
        <div className="lens-story-head">
          <span>nearby live-time</span>
          <strong>{getFeedLiveLensHeading({ total: metrics.total })}</strong>
        </div>
        <div className="lens-story-grid">
          {items.length === 0 ? (
            <div className="lens-empty-state">
              <strong>No nearby pulse yet</strong>
              <span>Be the first signal people see around here.</span>
            </div>
          ) : (
            items.map((item, index) => (
              <button
                className={`lens-story is-${item.tone}`}
                key={item.id}
                onClick={() => onOpenPost(item.id)}
                type="button"
              >
                <span className="lens-story-rank">{index + 1}</span>
                <span className="lens-story-copy">
                  <em>{item.signalLabel}</em>
                  <strong>{item.title}</strong>
                  <small>{item.meta}</small>
                </span>
                <ArrowUpRight />
              </button>
            ))
          )}
        </div>
      </div>

      <div className="lens-metric-strip" aria-label="Live lens metrics">
        <span>
          <MessageCircle />
          {metrics.comments}
        </span>
        <span>
          <Vote />
          {metrics.polls}
        </span>
        <span>
          <Camera />
          {metrics.photos}
        </span>
      </div>
    </section>
  );
};
