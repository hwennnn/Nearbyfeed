import { useCallback, useEffect, useState } from 'react';
import { type View } from '../app-types';
import { getRoutedViewFromSearch, getViewRouteUrl } from '../lib/view-route';

const getCurrentView = (): View => getRoutedViewFromSearch(window.location.search);

export const useRoutedView = (): [View, (view: View) => void] => {
  const [view, setViewState] = useState<View>(() => getCurrentView());

  useEffect(() => {
    const handlePopState = () => setViewState(getCurrentView());

    window.addEventListener('popstate', handlePopState);

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const setView = useCallback((nextView: View) => {
    setViewState(nextView);

    if (nextView === 'details') return;

    const nextUrl = getViewRouteUrl(window.location, nextView);
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (nextUrl !== currentUrl) {
      window.history.pushState(null, '', nextUrl);
    }
  }, []);

  return [view, setView];
};
