import { fireEvent, render, waitFor } from '@testing-library/react';
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
  setSelectedPostId = vi.fn(),
}: {
  posts?: Post[];
  selectedPostId?: number | null;
  setSelectedPostId?: (postId: number | null) => void;
}) => {
  const { containerRef } = useMapboxNearbyMap({
    coordinates: { latitude: 37.323, longitude: -122.0322 },
    distance: 500,
    liveUpdates: [],
    posts,
    selectedPostId,
    setSelectedPostId,
  });

  return <div data-testid="map-canvas" ref={containerRef} />;
};

const NearbyMapFrameProbe = ({
  posts = [selectedPost],
  selectedPostId = selectedPost.id,
  setSelectedPostId = vi.fn(),
}: {
  posts?: Post[];
  selectedPostId?: number | null;
  setSelectedPostId?: (postId: number | null) => void;
}) => {
  const { containerRef, frameNearbyActivity } = useMapboxNearbyMap({
    coordinates: { latitude: 37.323, longitude: -122.0322 },
    distance: 500,
    liveUpdates: [],
    posts,
    selectedPostId,
    setSelectedPostId,
  });

  return (
    <>
      <div data-testid="map-canvas" ref={containerRef} />
      <button onClick={frameNearbyActivity} type="button">
        frame
      </button>
    </>
  );
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

  it('clears stale selected posts and re-fits nearby activity after filters change', async () => {
    const setSelectedPostId = vi.fn();
    getBoundingClientRectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue({
        bottom: 760,
        height: 760,
        left: 0,
        right: 390,
        toJSON: vi.fn(),
        top: 0,
        width: 390,
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
      <NearbyMapProbe
        posts={[]}
        selectedPostId={selectedPost.id}
        setSelectedPostId={setSelectedPostId}
      />,
    );

    await waitFor(() => {
      expect(setSelectedPostId).toHaveBeenCalledWith(null);
      expect(fitBoundsMock).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          padding: {
            bottom: 340,
            left: 42,
            right: 42,
            top: 118,
          },
        }),
      );
    });
    expect(flyToMock).not.toHaveBeenCalled();
  });

  it('exposes a frame action that clears selection and fits nearby activity', async () => {
    const setSelectedPostId = vi.fn();
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

    const { getByRole } = render(
      <NearbyMapFrameProbe setSelectedPostId={setSelectedPostId} />,
    );

    await waitFor(() => {
      expect(flyToMock).toHaveBeenCalled();
    });

    fitBoundsMock.mockClear();
    fireEvent.click(getByRole('button', { name: 'frame' }));

    expect(setSelectedPostId).toHaveBeenCalledWith(null);
    expect(fitBoundsMock).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({
        duration: 900,
        essential: true,
      }),
    );
  });
});
