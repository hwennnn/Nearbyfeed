import { AppLayout } from './components/AppLayout';
import { AppViews } from './features/AppViews';
import { useNearbyFeedController } from './hooks/useNearbyFeedController';

export const App = () => {
  const app = useNearbyFeedController();

  return (
    <AppLayout
      activeView={app.view}
      session={app.session}
      setView={app.setView}
    >
      <AppViews app={app} />
    </AppLayout>
  );
};
