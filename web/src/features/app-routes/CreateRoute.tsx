import { CreateView } from '../create/CreateView';
import { type AppRouteProps } from './route-types';

export const CreateRoute = ({ app }: AppRouteProps) => (
  <CreateView
    coordinates={app.coordinates}
    locationName={app.locationName}
    onCreated={app.onPostCreated}
    session={app.session}
    setView={app.setView}
  />
);
