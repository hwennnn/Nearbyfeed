import { LogOut } from 'lucide-react';
import { type CommentWithPost, type Post, type User } from '../../types';
import { ProfileAccountPanel } from './ProfileAccountPanel';
import { ProfileActivityPanel } from './ProfileActivityPanel';
import { ProfileHero } from './ProfileHero';
import { ProfileTabs } from './ProfileTabs';
import { type ProfileTab } from './profile-types';

export const ProfileSignedIn = ({
  activeProvidersCount,
  mutedNotice,
  myComments,
  myPosts,
  onOpenPost,
  onUnblockUser,
  profile,
  profileTab,
  setProfileTab,
  signOut,
  unblockingUserId,
}: {
  activeProvidersCount: number;
  mutedNotice: string | null;
  myComments: CommentWithPost[];
  myPosts: Post[];
  onOpenPost: (post: Post) => void;
  onUnblockUser: (blockedId: number, username: string) => void;
  profile: User;
  profileTab: ProfileTab;
  setProfileTab: (tab: ProfileTab) => void;
  signOut: () => void;
  unblockingUserId: number | null;
}) => (
  <section className="profile-screen">
    <ProfileHero
      activeProvidersCount={activeProvidersCount}
      commentsCount={myComments.length}
      postsCount={myPosts.length}
      profile={profile}
    />

    <ProfileTabs activeTab={profileTab} onChange={setProfileTab} />

    {profileTab === 'blocked' && mutedNotice !== null && (
      <div className="success-note blocked-inline-notice" role="status">
        {mutedNotice}
      </div>
    )}

    {profileTab === 'account' ? (
      <ProfileAccountPanel profile={profile} />
    ) : (
      <ProfileActivityPanel
        blockedUsers={profile.blockedUsers ?? []}
        comments={myComments}
        onOpenPost={onOpenPost}
        onUnblockUser={onUnblockUser}
        posts={myPosts}
        profileTab={profileTab}
        unblockingUserId={unblockingUserId}
      />
    )}

    <button className="danger-button" onClick={signOut}>
      <LogOut />
      Log out
    </button>
  </section>
);
