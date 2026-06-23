import { ProfileView } from '../profile/ProfileView';
import { type AppRouteProps } from './route-types';

export const ProfileRoute = ({ app }: AppRouteProps) => (
  <ProfileView
    onSession={app.handleSession}
    onOpenPost={(post) => app.openPost(post, 'profile')}
    session={app.session}
    signOut={app.signOut}
  />
);
