import { type ReactNode } from 'react';
import { ProfileAuthScene } from './ProfileAuthScene';
import { type ProfileAuthExperience } from './profile-auth-presentation';

export const ProfileAuthStage = ({
  children,
  experience,
}: {
  children: ReactNode;
  experience: ProfileAuthExperience;
}) => (
  <section className="profile-screen auth-stage">
    <ProfileAuthScene experience={experience} />
    {children}
  </section>
);
