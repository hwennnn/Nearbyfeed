import { render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type Post } from '../../types';
import { useMapboxNearbyMap } from './useMapboxNearbyMap';

const addControlMock = vi.hoisted(() => vi.fn());
const addLayerMock = vi.hoisted(() => vi.fn());
const addSourceMock = vi.hoisted(() => vi.fn());
const fitBoundsMock = vi.hoisted(() => vi.fn());
const flyToMock = vi.hoisted(() => vi.fn());
const getSourceMock = vi.hoisted(() => vi.fn());
const isStyleLoadedMock = vi.hoisted(() => vi.fn());
const mapConstructorMock = vi.hoisted(() => vi.fn());
const mapOffMock = vi.hoisted(() => vi.fn());
const mapOnMock = vi.hoisted(() => vi.fn());
const mapOnceMock = vi.hoisted(() => vi.fn());
const mapRemoveMock = vi.hoisted(() => vi.fn());
const mapResizeMock = vi.hoisted(() => vi.fn());
const markerConstructorMock = vi.hoisted(() => vi.fn());
const navigationControlMock = vi.hoisted(() => vi.fn());

vi.mock('../../lib/constants', () => ({
  HAS_MAPBOX_ACCESS_TOKEN: true,
  MAPBOX_ACCESS_TOKEN: 'pk.test-token',
}));

vi.mock('mapbox-gl', () => ({
  default: {
    accessToken: '',
    Map: mapConstructorMock,
    Marker: markerConstructorMock,
    NavigationControl: navigationControlMock,
  },
}));

const mapInstance = {
  addControl: addControlMock,
  addLayer: addLayerMock,
  addSource: addSourceMock,
  fitBounds: fitBoundsMock,
  flyTo: flyToMock,
  getSource: getSourceMock,
  isStyleLoaded: isStyleLoadedMock,
  off: mapOffMock,
  on: mapOnMock,
  once: mapOnceMock,
  remove: mapRemoveMock,
  resize: mapResizeMock,
};

let resizeCallback: ResizeObserverCallback | undefined;
let observedElement: Element | undefined;
let disconnectMock = vi.fn();
let getBoundingClientRectSpy: ReturnType<typeof vi.spyOn> | undefined;

class FakeResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    resizeCallback = callback;
  }

  disconnect = disconnectMock;

  observe(element: Element) {
    observedElement = element;
  }
}

const selectedPost: Post = {
  commentsCount: 3,
  id: 77,
  latitude: 37.325,
  longitude: -122.029,
  points: 12,
  title: 'Food truck line is moving',
};

const NearbyMapProbe = ({
  posts = [],
  selectedPostId = null,
}: {
  posts?: Post[];
  selectedPostId?: number | null;
}) => {
  const { containerRef } = useMapboxNearbyMap({
    coordinates: { latitude: 37.323, longitude: -122.0322 },
    distance: 500,
    liveUpdates: [],
    posts,
    selectedPostId,
    setSelectedPostId: vi.fn(),
  });

  return <div data-testid="map-canvas" ref={containerRef} />;
};

describe('useMapboxNearbyMap', () => {
  afterEach(() => {
    addControlMock.mockReset();
    addLayerMock.mockReset();
    addSourceMock.mockReset();
    disconnectMock.mockReset();
    fitBoundsMock.mockReset();
    flyToMock.mockReset();
    getSourceMock.mockReset();
    isStyleLoadedMock.mockReset();
    mapConstructorMock.mockReset();
    mapOffMock.mockReset();
    mapOnMock.mockReset();
    mapOnceMock.mockReset();
    mapRemoveMock.mockReset();
    mapResizeMock.mockReset();
    markerConstructorMock.mockReset();
    navigationControlMock.mockReset();
    getBoundingClientRectSpy?.mockRestore();
    getBoundingClientRectSpy = undefined;
    observedElement = undefined;
    resizeCallback = undefined;
  });

  it('resizes Mapbox when the responsive map container changes size', async () => {
    Object.defineProperty(window, 'ResizeObserver', {
      configurable: true,
      value: FakeResizeObserver,
    });
    isStyleLoadedMock.mockReturnValue(true);
    mapConstructorMock.mockReturnValue(mapInstance);
    mapOnMock.mockImplementation((event: string, handler: () => void) => {
      if (event === 'load') handler();
    });
    markerConstructorMock.mockImplementation(() => ({
      addTo: vi.fn().mockReturnThis(),
      remove: vi.fn(),
      setLngLat: vi.fn().mockReturnThis(),
    }));

    const { getByTestId, unmount } = render(<NearbyMapProbe />);

    await waitFor(() => {
      expect(observedElement).toBe(getByTestId('map-canvas'));
    });

    fitBoundsMock.mockClear();
    mapResizeMock.mockClear();
    resizeCallback?.([], {} as ResizeObserver);

    expect(mapResizeMock).toHaveBeenCalledTimes(1);
    expect(fitBoundsMock).toHaveBeenCalledTimes(1);

    unmount();

    expect(disconnectMock).toHaveBeenCalled();
  });

  it('keeps selected post fly-to framing clear of the desktop live panel', async () => {
    getBoundingClientRectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue({
        bottom: 900,
        height: 900,
        left: 0,
        right: 1280,
        toJSON: vi.fn(),
        top: 0,
        width: 1280,
        x: 0,
        y: 0,
      });
    isStyleLoadedMock.mockReturnValue(true);
    mapConstructorMock.mockReturnValue(mapInstance);
    mapOnMock.mockImplementation((event: string, handler: () => void) => {
      if (event === 'load') handler();
    });
    markerConstructorMock.mockImplementation(() => ({
      addTo: vi.fn().mockReturnThis(),
      remove: vi.fn(),
      setLngLat: vi.fn().mockReturnThis(),
    }));

    render(
      <NearbyMapProbe posts={[selectedPost]} selectedPostId={selectedPost.id} />,
    );

    await waitFor(() => {
      expect(flyToMock).toHaveBeenCalledWith(
        expect.objectContaining({
          center: [selectedPost.longitude, selectedPost.latitude],
          padding: {
            bottom: 110,
            left: 72,
            right: 440,
            top: 134,
          },
        }),
      );
    });
  });
});
