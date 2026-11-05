import { useEffect, useRef } from 'react';
import { Map as MapLibre, setWorkerUrl, type GeoJSONSource } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { FeedItem, Place } from './feed-api';
import { circleRing, splitByPrecision } from './geo-presentation';

setWorkerUrl(workerUrl);

const STYLE_URL = 'https://tiles.openfreemap.org/styles/dark';
const PIN_SOURCE = 'nf-pins';
const AREA_SOURCE = 'nf-areas';
const ACCENT = '#ff8933';

// These mirror the panel sizes in explore.css.
const MOBILE_MAX_WIDTH = 760;
const DESKTOP_PANEL_WIDTH = 432;
const MOBILE_PANEL_SHARE = 0.58;

type ExploreMapProps = {
  place: Place;
  items: FeedItem[];
  selectedId: number | null;
  onSelect: (id: number) => void;
};

/** Keeps the camera centred on the part of the map the feed panel leaves open. */
const visiblePadding = () =>
  window.innerWidth > MOBILE_MAX_WIDTH
    ? { top: 0, right: 0, bottom: 0, left: DESKTOP_PANEL_WIDTH }
    : { top: 0, right: 0, bottom: window.innerHeight * MOBILE_PANEL_SHARE, left: 0 };

const pinData = (items: FeedItem[], selectedId: number | null) => ({
  type: 'FeatureCollection' as const,
  features: splitByPrecision(items).pinned.map((item) => ({
    type: 'Feature' as const,
    id: item.id,
    properties: { id: item.id, selected: item.id === selectedId },
    geometry: { type: 'Point' as const, coordinates: [item.lng, item.lat] },
  })),
});

const areaData = (items: FeedItem[]) => ({
  type: 'FeatureCollection' as const,
  features: splitByPrecision(items).areas.map((area) => ({
    type: 'Feature' as const,
    properties: { count: area.count },
    geometry: { type: 'Polygon' as const, coordinates: [circleRing(area)] },
  })),
});

export const ExploreMap = ({
  place,
  items,
  selectedId,
  onSelect,
}: ExploreMapProps) => {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibre | null>(null);
  const loaded = useRef(false);
  const latest = useRef({ items, selectedId, onSelect });
  latest.current = { items, selectedId, onSelect };

  useEffect(() => {
    if (!container.current) return undefined;

    const instance = new MapLibre({
      container: container.current,
      style: STYLE_URL,
      center: [place.lng, place.lat],
      zoom: 10.5,
      attributionControl: { compact: true },
    });
    map.current = instance;
    instance.setPadding(visiblePadding());

    instance.on('load', () => {
      instance.addSource(AREA_SOURCE, {
        type: 'geojson',
        data: areaData(latest.current.items),
      });
      instance.addSource(PIN_SOURCE, {
        type: 'geojson',
        data: pinData(latest.current.items, latest.current.selectedId),
      });

      instance.addLayer({
        id: 'nf-area-fill',
        type: 'fill',
        source: AREA_SOURCE,
        paint: { 'fill-color': ACCENT, 'fill-opacity': 0.07 },
      });
      instance.addLayer({
        id: 'nf-area-line',
        type: 'line',
        source: AREA_SOURCE,
        paint: {
          'line-color': ACCENT,
          'line-opacity': 0.45,
          'line-width': 1,
          'line-dasharray': [3, 3],
        },
      });
      instance.addLayer({
        id: 'nf-pin',
        type: 'circle',
        source: PIN_SOURCE,
        paint: {
          'circle-color': ACCENT,
          'circle-radius': ['case', ['get', 'selected'], 10, 6],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': ['case', ['get', 'selected'], 2.5, 1],
        },
      });

      instance.on('click', 'nf-pin', (event) => {
        const id = event.features?.[0]?.properties?.id as number | undefined;
        if (id !== undefined) latest.current.onSelect(id);
      });
      instance.on('mouseenter', 'nf-pin', () => {
        instance.getCanvas().style.cursor = 'pointer';
      });
      instance.on('mouseleave', 'nf-pin', () => {
        instance.getCanvas().style.cursor = '';
      });

      loaded.current = true;
    });

    return () => {
      loaded.current = false;
      map.current = null;
      instance.remove();
    };
    // The map is created once; later place changes fly the camera below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    map.current?.flyTo({ center: [place.lng, place.lat], zoom: 10.5 });
  }, [place.lat, place.lng]);

  useEffect(() => {
    if (!loaded.current || !map.current) return;
    (map.current.getSource(PIN_SOURCE) as GeoJSONSource | undefined)?.setData(
      pinData(items, selectedId),
    );
    (map.current.getSource(AREA_SOURCE) as GeoJSONSource | undefined)?.setData(
      areaData(items),
    );
  }, [items, selectedId]);

  // MapLibre's stylesheet sets position: relative on its container and loads
  // after ours, so the sizing has to live on a separate outer element.
  return (
    <div className="nf-map">
      <div ref={container} className="nf-map__canvas" aria-label="Map of nearby items" />
    </div>
  );
};
