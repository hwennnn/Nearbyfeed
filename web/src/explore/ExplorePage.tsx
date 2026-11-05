import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import './explore.css';
import { fetchFeed, type FeedItem, type Place } from './feed-api';
import { FeedCard } from './FeedCard';
import { hasExactLocation } from './geo-presentation';

const ExploreMap = lazy(() =>
  import('./ExploreMap').then((module) => ({ default: module.ExploreMap })),
);

const DEFAULT_PLACE: Place = { lat: 1.3521, lng: 103.8198, label: 'Singapore' };

const placeFromUrl = (): Place => {
  const params = new URLSearchParams(window.location.search);
  const lat = Number(params.get('lat'));
  const lng = Number(params.get('lng'));
  if (params.has('lat') && params.has('lng') && Number.isFinite(lat) && Number.isFinite(lng)) {
    return { lat, lng, label: params.get('label') ?? 'Selected area' };
  }
  return DEFAULT_PLACE;
};

const FeedSkeleton = () => (
  <div className="nf-feed__list" aria-hidden="true">
    {[0, 1, 2, 3].map((key) => (
      <div key={key} className="nf-skeleton" />
    ))}
  </div>
);

const ExplorePage = () => {
  const [place, setPlace] = useState(placeFromUrl);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const feed = useQuery({
    queryKey: ['feed', place.lat, place.lng],
    queryFn: ({ signal }) => fetchFeed(place, signal),
    staleTime: 30_000,
  });

  const items = useMemo(() => feed.data?.items ?? [], [feed.data]);

  const selectItem = useCallback((item: FeedItem) => {
    setSelectedId(item.id);
  }, []);

  useEffect(() => {
    if (selectedId === null) return;
    document
      .querySelector(`[data-item-id="${selectedId}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedId]);

  const useMyLocation = () => {
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPlace({ lat: coords.latitude, lng: coords.longitude, label: 'Near you' });
        setLocating(false);
      },
      () => {
        setLocationError(`Location is off. Showing ${place.label}.`);
        setLocating(false);
      },
      { timeout: 8000, maximumAge: 60_000 },
    );
  };

  const pinnedCount = items.filter(hasExactLocation).length;

  return (
    <div className="nf-app">
      <Suspense fallback={<div className="nf-map nf-map--loading" />}>
        <ExploreMap
          place={place}
          items={items}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </Suspense>

      <aside className="nf-feed" aria-label="Nearby feed">
        <header className="nf-feed__header">
          <div>
            <h1>{place.label}</h1>
            <p aria-live="polite">
              {feed.isSuccess
                ? `${items.length} nearby · ${pinnedCount} on the map`
                : 'Finding what is nearby'}
            </p>
          </div>
          <button
            type="button"
            className="nf-button"
            onClick={useMyLocation}
            disabled={locating}
          >
            {locating ? 'Locating' : 'Use my location'}
          </button>
        </header>

        {locationError && <p className="nf-notice">{locationError}</p>}

        {feed.isPending && <FeedSkeleton />}

        {feed.isError && (
          <div className="nf-state">
            <h2>Could not load this area</h2>
            <p>Check your connection and try again.</p>
            <button type="button" className="nf-button" onClick={() => void feed.refetch()}>
              Try again
            </button>
          </div>
        )}

        {feed.isSuccess && items.length === 0 && (
          <div className="nf-state">
            <h2>Nothing here this week</h2>
            <p>New posts and videos from this area will show up here.</p>
          </div>
        )}

        {items.length > 0 && (
          <div className="nf-feed__list">
            {items.map((item) => (
              <FeedCard
                key={item.id}
                item={item}
                selected={item.id === selectedId}
                onSelect={selectItem}
              />
            ))}
          </div>
        )}
      </aside>
    </div>
  );
};

export default ExplorePage;
