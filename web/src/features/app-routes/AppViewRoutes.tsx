import { CreateRoute } from './CreateRoute';
import { DetailsRoute } from './DetailsRoute';
import { FeedRoute } from './FeedRoute';
import { MapRoute } from './MapRoute';
import { ProfileRoute } from './ProfileRoute';
import { type AppRouteProps } from './route-types';

export const AppViewRoutes = ({ app }: AppRouteProps) => {
  switch (app.view) {
    case 'create':
      return <CreateRoute app={app} />;
    case 'details':
      return <DetailsRoute app={app} />;
    case 'map':
      return <MapRoute app={app} />;
    case 'profile':
      return <ProfileRoute app={app} />;
    case 'feed':
    default:
      return <FeedRoute app={app} />;
  }
};
