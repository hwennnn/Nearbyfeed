import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type LiveUpdate } from '../types';
import { useNearbyLiveUpdates } from './useNearbyLiveUpdates';

const fetchLiveUpdatesMock = vi.hoisted(() => vi.fn());

vi.mock('../lib/api', () => ({
  fetchLiveUpdates: fetchLiveUpdatesMock,
}));

const wrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const liveUpdate: LiveUpdate = {
  id: 'x-live-1',
  title: 'Cafe line is moving',
  summary: 'People nearby say the queue is short.',
  url: 'https://x.com/example/status/1',
  source: 'x',
  occurredAt: new Date('2026-06-23T08:00:00Z').toISOString(),
  tags: ['food'],
};

describe('useNearbyLiveUpdates', () => {
  afterEach(() => {
    fetchLiveUpdatesMock.mockReset();
  });

  it('fetches live enrichment on the feed so the scene board can be honest', async () => {
    fetchLiveUpdatesMock.mockResolvedValue([liveUpdate]);

    const { result } = renderHook(
      () =>
        useNearbyLiveUpdates({
          coordinates: { latitude: 37.323, longitude: -122.0322 },
          distance: 200,
          locationName: 'Cupertino',
          timeWindow: '24h',
          view: 'feed',
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.liveUpdates).toEqual([liveUpdate]);
    });
    expect(result.current.isLiveFallback).toBe(false);
    expect(fetchLiveUpdatesMock).toHaveBeenCalledWith({
      latitude: 37.323,
      longitude: -122.0322,
      distance: 200,
      locationName: 'Cupertino',
      timeWindow: '24h',
    });
  });

  it('does not fetch live enrichment on non-live product views', async () => {
    renderHook(
      () =>
        useNearbyLiveUpdates({
          coordinates: { latitude: 37.323, longitude: -122.0322 },
          distance: 200,
          locationName: 'Cupertino',
          timeWindow: '24h',
          view: 'profile',
        }),
      { wrapper },
    );

    expect(fetchLiveUpdatesMock).not.toHaveBeenCalled();
  });
});
