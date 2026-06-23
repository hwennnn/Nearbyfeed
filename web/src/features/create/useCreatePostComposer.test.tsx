import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useCreatePostComposer } from './useCreatePostComposer';

const createPostMock = vi.hoisted(() => vi.fn());
const captureEventMock = vi.hoisted(() => vi.fn());

vi.mock('../../lib/api', () => ({
  captureEvent: captureEventMock,
  createPost: createPostMock,
}));

const wrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const renderComposer = () =>
  renderHook(
    () =>
      useCreatePostComposer({
        coordinates: { latitude: 37.323, longitude: -122.0322 },
        locationName: 'Cupertino Library',
        onCreated: vi.fn(),
      }),
    { wrapper },
  );

describe('useCreatePostComposer', () => {
  afterEach(() => {
    captureEventMock.mockReset();
    createPostMock.mockReset();
  });

  it('does not submit invalid drafts even when submit is called directly', () => {
    const { result } = renderComposer();

    expect(result.current.submitPost()).toBe(false);
    expect(createPostMock).not.toHaveBeenCalled();
  });

  it('submits valid drafts through the shared payload builder', async () => {
    createPostMock.mockResolvedValueOnce({ id: 1 });
    const { result } = renderComposer();

    act(() => {
      result.current.setTitle('Library steps are buzzing');
    });

    expect(result.current.submitPost()).toBe(true);

    await waitFor(() => {
      expect(createPostMock).toHaveBeenCalledWith(
        expect.objectContaining({
          location: expect.objectContaining({ name: 'Cupertino Library' }),
          title: 'Library steps are buzzing',
        }),
      );
    });
  });
});
