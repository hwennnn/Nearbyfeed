import { type View } from '../../app-types';
import { DetailsView } from '../details/DetailsView';
import { type AppRouteProps } from './route-types';

const DETAILS_BACK_LABELS: Record<View, string> = {
  create: 'Post',
  details: 'Feed',
  feed: 'Feed',
  map: 'Map',
  profile: 'Profile',
};

export const DetailsRoute = ({ app }: AppRouteProps) => {
  if (app.selectedPost === undefined) return null;

  return (
    <DetailsView
      backLabel={DETAILS_BACK_LABELS[app.detailsBackView]}
      onBack={() => app.setView(app.detailsBackView)}
      post={app.selectedPost}
      session={app.session}
      setView={app.setView}
    />
  );
};
