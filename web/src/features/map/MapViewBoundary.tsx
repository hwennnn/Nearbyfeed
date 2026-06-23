import { lazy, Suspense } from 'react';
import { type MapViewProps } from './MapView';

const LazyMapView = lazy(async () => {
  const module = await import('./MapView');
  return { default: module.MapView };
});

export const MapViewBoundary = (props: MapViewProps) => (
  <Suspense fallback={<div className="loading-strip">opening the live map...</div>}>
    <LazyMapView {...props} />
  </Suspense>
);
