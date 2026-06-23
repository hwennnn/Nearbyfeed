import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useProfileViewModel } from './useProfileViewModel';

const wrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useProfileViewModel', () => {
  it('starts anonymous users in the login auth state', () => {
    const { result } = renderHook(
      () =>
        useProfileViewModel({
          onSession: vi.fn(),
          session: null,
        }),
      { wrapper },
    );

    expect(result.current.state).toBe('auth');
    expect(result.current.auth.mode).toBe('login');
    expect(result.current.auth.email).toBe('');
    expect(result.current.auth.password).toBe('');
  });
});
