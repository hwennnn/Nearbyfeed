import { ProfileAuthFormPanel } from './ProfileAuthFormPanel';
import { ProfileAuthStage } from './ProfileAuthStage';
import {
  getProfileAuthExperience,
  type ProfileAuthMode,
} from './profile-auth-presentation';

export const ProfileAuthCard = ({
  email,
  isError,
  isPending,
  mode,
  notice,
  onEmailChange,
  onModeChange,
  onPasswordChange,
  onSubmit,
  onUsernameChange,
  password,
  username,
}: {
  email: string;
  isError: boolean;
  isPending: boolean;
  mode: ProfileAuthMode;
  notice: string | null;
  onEmailChange: (value: string) => void;
  onModeChange: (mode: ProfileAuthMode) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  onUsernameChange: (value: string) => void;
  password: string;
  username: string;
}) => {
  const experience = getProfileAuthExperience(mode);

  return (
    <ProfileAuthStage experience={experience}>
      <ProfileAuthFormPanel
        email={email}
        experience={experience}
        isError={isError}
        isPending={isPending}
        mode={mode}
        notice={notice}
        onEmailChange={onEmailChange}
        onModeChange={onModeChange}
        onPasswordChange={onPasswordChange}
        onSubmit={onSubmit}
        onUsernameChange={onUsernameChange}
        password={password}
        username={username}
      />
    </ProfileAuthStage>
  );
};
