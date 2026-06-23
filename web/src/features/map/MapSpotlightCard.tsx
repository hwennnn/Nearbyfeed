import { ArrowUpRight, MousePointer2 } from 'lucide-react';
import { timeAgo } from '../../lib/format';
import { type Post } from '../../types';
import {
  getMapPostSignalLabel,
  getMapPostTone,
} from './map-presentation';

export const MapSpotlightCard = ({
  mode,
  onOpenPost,
  post,
}: {
  mode: 'featured' | 'selected';
  onOpenPost: (postId: number) => void;
  post?: Post;
}) => {
  if (post === undefined) {
    return (
      <div className="map-empty-spotlight">
        <MousePointer2 />
        <strong>No nearby drops yet</strong>
        <span>Widen the radius or post what people should know.</span>
      </div>
    );
  }

  const tone = getMapPostTone(post);

  return (
    <button
      className={`selected-map-post is-${tone}`}
      onClick={() => onOpenPost(post.id)}
      type="button"
    >
      <span className="spotlight-kicker">
        {mode === 'selected' ? 'selected post' : 'hottest nearby'}
      </span>
      <strong>{post.title}</strong>
      <span>
        {getMapPostSignalLabel(post)} · {post.locationName ?? 'near you'} ·{' '}
        {timeAgo(post.createdAt)}
      </span>
      <em>
        Open thread
        <ArrowUpRight />
      </em>
    </button>
  );
};
