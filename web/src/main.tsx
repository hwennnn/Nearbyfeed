import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// /explore is the rebuilt app. It replaces the legacy views in M3, and splitting
// here keeps legacy code and styles out of its first load.
const isExplore = window.location.pathname.startsWith('/explore');
const Root = lazy(() =>
  isExplore ? import('./explore/ExplorePage') : import('./LegacyApp'),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={null}>
        <Root />
      </Suspense>
    </QueryClientProvider>
  </React.StrictMode>,
);
