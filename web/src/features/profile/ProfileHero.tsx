import { Radio } from 'lucide-react';
import { Avatar } from '../../components/Avatar';
import { type User } from '../../types';

export const ProfileHero = ({
  activeProvidersCount,
  commentsCount,
  postsCount,
  profile,
}: {
  activeProvidersCount: number;
  commentsCount: number;
  postsCount: number;
  profile: User;
}) => (
  <div className="profile-hero">
    <div className="profile-live-badge">
      <Radio />
      Live identity
    </div>
    <div className="profile-avatar-ring">
      <Avatar image={profile.image} name={profile.username} />
    </div>
    <h1>{profile.username}</h1>
    <p>{profile.email}</p>
    <div className="profile-stats">
      <span>
        <strong>{postsCount}</strong>
        posts
      </span>
      <span>
        <strong>{commentsCount}</strong>
        comments
      </span>
      <span>
        <strong>{activeProvidersCount}</strong>
        linked
      </span>
    </div>
  </div>
);
