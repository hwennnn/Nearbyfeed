import { Flame, MessageCircle, Sparkles, UserCheck } from 'lucide-react';
import { Avatar } from '../../components/Avatar';
import { timeAgo } from '../../lib/format';
import { type CommentWithPost, type Post, type User } from '../../types';
import { getBlockedUserLabel } from '../moderation/block-presentation';
import { type ProfileTab } from './profile-types';

const ProfileEmptyState = ({
  body,
  title,
}: {
  body: string;
  title: string;
}) => (
  <div className="empty-state profile-empty-state">
    <Sparkles />
    <strong>{title}</strong>
    <span>{body}</span>
  </div>
);

export const ProfileActivityPanel = ({
  blockedUsers,
  comments,
  onOpenPost,
  onUnblockUser,
  posts,
  profileTab,
  unblockingUserId,
}: {
  blockedUsers: NonNullable<User['blockedUsers']>;
  comments: CommentWithPost[];
  onOpenPost: (post: Post) => void;
  onUnblockUser?: (blockedId: number, username: string) => void;
  posts: Post[];
  profileTab: Exclude<ProfileTab, 'account'>;
  unblockingUserId?: number | null;
}) => {
  if (profileTab === 'posts') {
    return (
      <div className="activity-panel">
        {posts.length === 0 ? (
          <ProfileEmptyState
            body="Post a nearby moment and your local footprint starts here."
            title="No drops yet"
          />
        ) : (
          posts.map((post) => (
            <button
              className="activity-row activity-row-button"
              key={post.id}
              onClick={() => onOpenPost(post)}
              type="button"
            >
              <Flame />
              <span>
                <strong>{post.title}</strong>
                {post.locationName ?? 'Nearby'} · {timeAgo(post.createdAt)}
              </span>
              <em>{post.points}</em>
            </button>
          ))
        )}
      </div>
    );
  }

  if (profileTab === 'comments') {
    return (
      <div className="activity-panel">
        {comments.length === 0 ? (
          <ProfileEmptyState
            body="React to a live post and your replies show up here."
            title="No replies yet"
          />
        ) : (
          comments.map((comment) => (
            <button
              className="activity-row activity-row-button"
              key={comment.id}
              onClick={() => onOpenPost(comment.post)}
              type="button"
            >
              <MessageCircle />
              <span>
                <strong>{comment.content}</strong>
                on {comment.post.title}
              </span>
              <em>{timeAgo(comment.createdAt)}</em>
            </button>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="activity-panel">
      {blockedUsers.length === 0 ? (
        <ProfileEmptyState
          body="Your radius is clean. Muted accounts will appear here."
          title="No muted accounts"
        />
      ) : (
        blockedUsers.map((user) => (
          <div className="activity-row blocked-user-row" key={user.id}>
            <Avatar image={user.image} name={user.username} />
            <span>
              <strong>{user.username}</strong>
              {getBlockedUserLabel(user.username)}
            </span>
            {onUnblockUser !== undefined && (
              <button
                aria-label={`Unmute ${user.username}`}
                className="activity-pill-button"
                disabled={unblockingUserId === user.id}
                onClick={() => onUnblockUser(user.id, user.username)}
                type="button"
              >
                <UserCheck />
                {unblockingUserId === user.id ? 'Unmuting' : 'Unmute'}
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
};
