import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { useState } from 'react';
import { votePost } from '../../lib/api';
import { type Post, type Session } from '../../types';
import { BlockUserActionButton } from '../moderation/BlockUserActionButton';
import { ReportActionButton } from '../moderation/ReportActionButton';
import { type FeedAuthIntent } from './feed-auth';
import {
  sharePost,
  type SharePostResult,
  type SharePostTarget,
} from './post-share';

type ShareStatus = SharePostResult | 'failed' | 'idle' | 'sharing';

const shareStatusLabel: Record<ShareStatus, string> = {
  clipboard: 'link copied',
  failed: 'share failed',
  idle: '',
  native: 'sent',
  sharing: 'sharing',
  unsupported: 'copy unavailable',
};

export const FeedCardActions = ({
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
  const queryClient = useQueryClient();
  const [shareStatus, setShareStatus] = useState<ShareStatus>('idle');
  const voteMutation = useMutation({
    mutationFn: async () => await votePost(post.id, post.like?.value === 1 ? 0 : 1),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
  const isLiked = post.like?.value === 1;
  const likeLabel =
    session === null ? 'Sign in to like' : isLiked ? 'Unlike' : 'Like';
  const showShareStatus = shareStatus !== 'idle';

  const handleShare = async () => {
    setShareStatus('sharing');

    try {
      setShareStatus(await sharePost(post, shareTarget));
    } catch {
      setShareStatus('failed');
    }
  };

  return (
    <div className="card-actions">
      <button
        aria-label={likeLabel}
        onClick={() => {
          if (session === null) {
            onRequireAuth?.('like');
            return;
          }
          voteMutation.mutate();
        }}
        title={likeLabel}
        type="button"
      >
        <Heart className={isLiked ? 'filled-heart' : ''} />
        <span>{post.points > 0 ? post.points : 'Like'}</span>
      </button>
      <button onClick={onOpen} type="button">
        <MessageCircle />
        <span>{post.commentsCount}</span>
      </button>
      <button
        aria-label="Share post"
        disabled={shareStatus === 'sharing'}
        onClick={() => {
          void handleShare();
        }}
        title="Share post"
        type="button"
      >
        <Share2 />
        <span>Share</span>
      </button>
      {showShareStatus && (
        <span className={`share-status-pill is-${shareStatus}`} role="status">
          {shareStatusLabel[shareStatus]}
        </span>
      )}
      {onReport !== undefined && (
        <ReportActionButton label="Report" onClick={onReport} />
      )}
      {onBlock !== undefined && (
        <BlockUserActionButton label="Mute" onClick={onBlock} />
      )}
    </div>
  );
};
