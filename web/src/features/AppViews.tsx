import { TopBar } from '../components/TopBar';
import { type NearbyFeedController } from '../hooks/useNearbyFeedController';
import { useViewScrollReset } from '../hooks/useViewScrollReset';
import { AppViewRoutes } from './app-routes/AppViewRoutes';

export const AppViews = ({ app }: { app: NearbyFeedController }) => {
  useViewScrollReset({
    selectedPostId: app.selectedPostId,
    view: app.view,
  });

  return (
    <main className={`app-main app-main-${app.view}`}>
      {app.view !== 'map' && (
        <TopBar
          distance={app.distance}
          isDemoMode={app.isDemoMode}
          locationName={app.locationName}
          locationStatus={app.locationStatus}
          session={app.session}
          setDistance={app.setDistance}
          setTimeWindow={app.setTimeWindow}
          setView={app.setView}
          timeWindow={app.timeWindow}
        />
      )}

      <AppViewRoutes app={app} />
    </main>
  );
};
