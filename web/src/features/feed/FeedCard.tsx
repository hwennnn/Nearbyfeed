import { MapPin } from 'lucide-react';
import { Avatar } from '../../components/Avatar';
import { timeAgo } from '../../lib/format';
import { type Post, type Session } from '../../types';
import { FeedCardActions } from './FeedCardActions';
import { getPostSignal } from './feed-presentation';
import { type FeedAuthIntent } from './feed-auth';
import { type SharePostTarget } from './post-share';
import { PollPreview } from './PollPreview';

export const FeedCard = ({
  onBlock,
  onOpen,
  onRequireAuth,
  onReport,
  post,
  session,
  shareTarget,
}: {
  onBlock?: () => void;
  onOpen: () => void;
  onRequireAuth?: (intent: FeedAuthIntent) => void;
  onReport?: () => void;
  post: Post;
  session: Session | null;
  shareTarget?: SharePostTarget;
}) => {
  const images = post.images ?? [];
  const firstImage = images[0];
  const signal = getPostSignal(post);

  return (
    <article className={`feed-card is-${signal.tone}`}>
      <div className="card-author-row">
        <Avatar image={post.author?.image} name={post.author?.username} />
        <div>
          <strong>{post.author?.username ?? 'nearby'}</strong>
          <span>
            {timeAgo(post.createdAt)} · {post.locationName ?? 'Nearby'}
          </span>
        </div>
        <span className={`post-signal-chip is-${signal.tone}`}>{signal.label}</span>
      </div>
      <h2>
        <button className="post-title-button" onClick={onOpen} type="button">
          {post.title}
        </button>
      </h2>
      {post.content !== null && post.content !== undefined && (
        <p className="post-copy">{post.content}</p>
      )}
      {firstImage !== undefined && (
        <div className="post-image-wrap">
          <img src={firstImage} alt="" loading="lazy" />
          {images.length > 1 && <span className="image-count">1 / {images.length}</span>}
        </div>
      )}
      {post.poll !== null && post.poll !== undefined && <PollPreview poll={post.poll} />}
      {post.location !== null && post.location !== undefined && (
        <div className="location-card">
          <MapPin />
          <span>
            <strong>{post.location.name}</strong>
            {post.location.formattedAddress}
          </span>
        </div>
      )}
      <FeedCardActions
        onBlock={onBlock}
        onOpen={onOpen}
        onRequireAuth={onRequireAuth}
        onReport={onReport}
        post={post}
        session={session}
        shareTarget={shareTarget}
      />
    </article>
  );
};
