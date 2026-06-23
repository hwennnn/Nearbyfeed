import { type DistanceMeters } from '@nearbyfeed/shared';
import mapboxgl from 'mapbox-gl';
import { useEffect, useRef, useState } from 'react';
import {
  HAS_MAPBOX_ACCESS_TOKEN,
  MAPBOX_ACCESS_TOKEN,
} from '../../lib/constants';
import {
  createRadiusFieldGeoJson,
  getNearbyMapBounds,
  getNearbyMapFitPadding,
  getNearbyRadiusZoom,
} from '../../lib/map-utils';
import { type Coordinates, type LiveUpdate, type Post } from '../../types';
import {
  createLiveSignalMarkerElement,
  createPostMarkerElement,
} from './map-marker-elements';
import {
  getLiveMapSignals,
} from './map-presentation';

const getPostMapPoints = (posts: Post[]) =>
  posts.map((post) => ({
    latitude: post.latitude,
    longitude: post.longitude,
  }));

export const useMapboxNearbyMap = ({
  coordinates,
  distance,
  liveUpdates,
  posts,
  selectedPostId,
  setSelectedPostId,
}: {
  coordinates: Coordinates;
  distance: DistanceMeters;
  liveUpdates: LiveUpdate[];
  posts: Post[];
  selectedPostId: number | null;
  setSelectedPostId: (postId: number | null) => void;
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const liveMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (containerRef.current === null || mapRef.current !== null) return;
    if (!HAS_MAPBOX_ACCESS_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
    const map = new mapboxgl.Map({
      center: [coordinates.longitude, coordinates.latitude],
      container: containerRef.current,
      pitch: 24,
      style: 'mapbox://styles/mapbox/streets-v12',
      zoom: getNearbyRadiusZoom(coordinates, distance),
    });

    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      'bottom-right',
    );
    map.on('load', () => setMapReady(true));
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [coordinates.latitude, coordinates.longitude]);

  useEffect(() => {
    const map = mapRef.current;
    if (map === null || !mapReady) return;
    if (selectedPostId !== null) return;

    const liveSignalPoints = getLiveMapSignals(
      liveUpdates,
      coordinates,
      distance,
    ).map((signal) => signal.coordinates);
    const rect = containerRef.current?.getBoundingClientRect();

    map.fitBounds(
      getNearbyMapBounds({
        center: coordinates,
        points: [...getPostMapPoints(posts), ...liveSignalPoints],
        radiusMeters: distance,
      }),
      {
        duration: 900,
        essential: true,
        maxZoom: 16,
        padding: getNearbyMapFitPadding({
          height: rect?.height ?? 900,
          width: rect?.width ?? 1280,
        }),
      },
    );
  }, [coordinates, distance, liveUpdates, mapReady, posts, selectedPostId]);

  useEffect(() => {
    const map = mapRef.current;
    if (map === null || !mapReady) return;

    const updateRadiusLayer = () => {
      if (!map.isStyleLoaded()) return;

      const radiusField = createRadiusFieldGeoJson(coordinates, distance);
      const source = map.getSource('nearby-radius-field') as
        | mapboxgl.GeoJSONSource
        | undefined;

      if (source === undefined) {
        map.addSource('nearby-radius-field', {
          type: 'geojson',
          data: radiusField,
        });
        map.addLayer({
          id: 'nearby-radius-fill',
          type: 'fill',
          source: 'nearby-radius-field',
          filter: ['==', ['get', 'kind'], 'radius'],
          paint: {
            'fill-color': '#ff8933',
            'fill-opacity': 0.2,
          },
        });
        map.addLayer({
          id: 'nearby-radius-glow',
          type: 'line',
          source: 'nearby-radius-field',
          filter: ['==', ['get', 'kind'], 'radius'],
          paint: {
            'line-blur': 8,
            'line-color': '#ff8933',
            'line-opacity': 0.48,
            'line-width': 8,
          },
        });
        map.addLayer({
          id: 'nearby-radius-line',
          type: 'line',
          source: 'nearby-radius-field',
          filter: ['==', ['get', 'kind'], 'radius'],
          paint: {
            'line-color': '#ff8933',
            'line-dasharray': [2, 2],
            'line-opacity': 0.9,
            'line-width': 2.5,
          },
        });
        map.addLayer({
          id: 'nearby-center-halo',
          type: 'circle',
          source: 'nearby-radius-field',
          filter: ['==', ['get', 'kind'], 'center'],
          paint: {
            'circle-blur': 0.18,
            'circle-color': '#5ff2ae',
            'circle-opacity': 0.22,
            'circle-radius': 30,
          },
        });
        map.addLayer({
          id: 'nearby-center-puck',
          type: 'circle',
          source: 'nearby-radius-field',
          filter: ['==', ['get', 'kind'], 'center'],
          paint: {
            'circle-color': '#5ff2ae',
            'circle-radius': 8,
            'circle-stroke-color': '#101113',
            'circle-stroke-width': 3,
          },
        });
      } else {
        source.setData(radiusField);
      }
    };

    if (map.isStyleLoaded()) {
      updateRadiusLayer();
      return;
    }

    map.once('idle', updateRadiusLayer);

    return () => {
      map.off('idle', updateRadiusLayer);
    };
  }, [coordinates, distance, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (map === null || !mapReady || selectedPostId === null) return;

    const selectedPost = posts.find((post) => post.id === selectedPostId);
    if (selectedPost === undefined) return;

    map.flyTo({
      center: [selectedPost.longitude, selectedPost.latitude],
      essential: true,
      zoom: Math.max(15, getNearbyRadiusZoom(coordinates, distance)),
    });
  }, [coordinates, distance, mapReady, posts, selectedPostId]);

  useEffect(() => {
    const map = mapRef.current;
    if (map === null || !mapReady) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = posts.map((post) => {
      const element = createPostMarkerElement({
        onSelectPost: setSelectedPostId,
        post,
        selectedPostId,
      });

      return new mapboxgl.Marker({ element, anchor: 'bottom' })
        .setLngLat([post.longitude, post.latitude])
        .addTo(map);
    });
  }, [mapReady, posts, selectedPostId, setSelectedPostId]);

  useEffect(() => {
    const map = mapRef.current;
    if (map === null || !mapReady) return;

    liveMarkersRef.current.forEach((marker) => marker.remove());
    liveMarkersRef.current = getLiveMapSignals(
      liveUpdates,
      coordinates,
      distance,
    ).map((signal) => {
      const element = createLiveSignalMarkerElement(signal);

      return new mapboxgl.Marker({
        element,
        anchor: 'center',
        offset: [0, -28],
      })
        .setLngLat([signal.coordinates.longitude, signal.coordinates.latitude])
        .addTo(map);
    });
  }, [coordinates, distance, liveUpdates, mapReady]);

  return { containerRef };
};
