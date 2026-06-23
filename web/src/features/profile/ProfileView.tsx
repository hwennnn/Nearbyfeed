import { type Post, type Session } from '../../types';
import { ProfileAuthCard } from './ProfileAuthCard';
import { ProfileSignedIn } from './ProfileSignedIn';
import { ProfileVerifyEmailCard } from './ProfileVerifyEmailCard';
import { useProfileViewModel } from './useProfileViewModel';

export const ProfileView = ({
  onSession,
  onOpenPost,
  session,
  signOut,
}: {
  onSession: (session: Session) => void;
  onOpenPost: (post: Post) => void;
  session: Session | null;
  signOut: () => void;
}) => {
  const profileView = useProfileViewModel({ onSession, session });

  if (profileView.state === 'signed-in' && profileView.signedIn !== null) {
    return (
      <ProfileSignedIn
        activeProvidersCount={profileView.signedIn.activeProvidersCount}
        mutedNotice={profileView.signedIn.mutedNotice}
        myComments={profileView.signedIn.myComments}
        myPosts={profileView.signedIn.myPosts}
        onOpenPost={onOpenPost}
        onUnblockUser={profileView.signedIn.onUnblockUser}
        profile={profileView.signedIn.profile}
        profileTab={profileView.signedIn.profileTab}
        setProfileTab={profileView.signedIn.setProfileTab}
        signOut={signOut}
        unblockingUserId={profileView.signedIn.unblockingUserId}
      />
    );
  }

  if (profileView.state === 'verify' && profileView.verify !== null) {
    return (
      <ProfileVerifyEmailCard
        isError={profileView.verify.isError}
        isResending={profileView.verify.isResending}
        isVerifying={profileView.verify.isVerifying}
        notice={profileView.verify.notice}
        onBack={profileView.verify.onBack}
        onOtpChange={profileView.verify.onOtpChange}
        onResend={profileView.verify.onResend}
        onSubmit={profileView.verify.onSubmit}
        otpCode={profileView.verify.otpCode}
        pendingRegistration={profileView.verify.pendingRegistration}
      />
    );
  }

  return (
    <ProfileAuthCard
      email={profileView.auth.email}
      isError={profileView.auth.isError}
      isPending={profileView.auth.isPending}
      mode={profileView.auth.mode}
      notice={profileView.auth.notice}
      onEmailChange={profileView.auth.onEmailChange}
      onModeChange={profileView.auth.onModeChange}
      onPasswordChange={profileView.auth.onPasswordChange}
      onSubmit={profileView.auth.onSubmit}
      onUsernameChange={profileView.auth.onUsernameChange}
      password={profileView.auth.password}
      username={profileView.auth.username}
    />
  );
};
