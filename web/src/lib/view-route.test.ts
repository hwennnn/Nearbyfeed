import { describe, expect, it } from 'vitest';
import {
  getRoutedViewFromSearch,
  getViewRouteUrl,
  isRoutableView,
} from './view-route';

describe('view route helpers', () => {
  it.each([
    ['feed', true],
    ['map', true],
    ['create', true],
    ['profile', true],
    ['details', false],
    ['unknown', false],
  ])('treats %s routable as %s', (view, expected) => {
    expect(isRoutableView(view)).toBe(expected);
  });

  it.each([
    ['?view=map', 'map'],
    ['?post=42&view=profile', 'profile'],
    ['?view=details', 'feed'],
    ['?view=unknown', 'feed'],
    ['', 'feed'],
  ])('parses %s as %s', (search, expected) => {
    expect(getRoutedViewFromSearch(search)).toBe(expected);
  });

  it('keeps feed URLs clean and clears stale post deep links', () => {
    expect(
      getViewRouteUrl({
        hash: '',
        pathname: '/',
        search: '?view=map&post=42&distance=500',
      }, 'feed'),
    ).toBe('/?distance=500');
  });

  it('sets routable view params while preserving unrelated URL state', () => {
    expect(
      getViewRouteUrl({
        hash: '#nearby',
        pathname: '/app',
        search: '?post=42&distance=500',
      }, 'map'),
    ).toBe('/app?distance=500&view=map#nearby');
  });
});
