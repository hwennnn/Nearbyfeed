import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useRoutedView } from './useRoutedView';

describe('useRoutedView', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('starts from the current view search param', () => {
    window.history.replaceState(null, '', '/?view=map');

    const { result } = renderHook(() => useRoutedView());

    expect(result.current[0]).toBe('map');
  });

  it('starts from clean view paths', () => {
    window.history.replaceState(null, '', '/map');

    const { result } = renderHook(() => useRoutedView());

    expect(result.current[0]).toBe('map');
  });

  it('pushes routable view changes into the URL', () => {
    const { result } = renderHook(() => useRoutedView());

    act(() => result.current[1]('profile'));

    expect(result.current[0]).toBe('profile');
    expect(window.location.pathname).toBe('/profile');
    expect(window.location.search).toBe('');
  });

  it('clears stale post links when returning to a routable view', () => {
    window.history.replaceState(null, '', '/?post=9&view=map');
    const { result } = renderHook(() => useRoutedView());

    act(() => result.current[1]('feed'));

    expect(result.current[0]).toBe('feed');
    expect(window.location.search).toBe('');
  });

  it('keeps details transient instead of writing it into the URL', () => {
    window.history.replaceState(null, '', '/?view=map');
    const { result } = renderHook(() => useRoutedView());

    act(() => result.current[1]('details'));

    expect(result.current[0]).toBe('details');
    expect(window.location.search).toBe('?view=map');
  });

  it('reacts to browser back and forward navigation', () => {
    const { result } = renderHook(() => useRoutedView());

    window.history.pushState(null, '', '/create');
    act(() => window.dispatchEvent(new PopStateEvent('popstate')));

    expect(result.current[0]).toBe('create');
  });
});
