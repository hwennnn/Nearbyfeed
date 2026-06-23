import { MapPin, MessageCircle, Radio, Users, Vote } from 'lucide-react';
import { type Comment, type Post } from '../../types';
import { getThreadMetrics } from './details-presentation';

export const DetailsPulseRail = ({
  comments,
  post,
}: {
  comments: Comment[];
  post: Post;
}) => {
  const metrics = getThreadMetrics(post, comments);

  return (
    <aside className="details-pulse-rail">
      <div className={`thread-score is-${metrics.energy}`}>
        <Radio />
        <strong>{metrics.score}</strong>
        <span>{metrics.energyLabel}</span>
      </div>
      <div className="thread-stat-row">
        <span>
          <MessageCircle />
          replies
        </span>
        <strong>{metrics.commentLabel}</strong>
      </div>
      <div className="thread-stat-row">
        <span>
          <Users />
          voices
        </span>
        <strong>{metrics.participantCount}</strong>
      </div>
      <div className="thread-stat-row">
        <span>
          <Vote />
          poll
        </span>
        <strong>{metrics.pollLabel}</strong>
      </div>
      <div className="thread-place-card">
        <MapPin />
        <span>
          <strong>{post.location?.name ?? post.locationName ?? 'Nearby'}</strong>
          {post.location?.formattedAddress ?? post.fullLocationName ?? 'Local context'}
        </span>
      </div>
    </aside>
  );
};
