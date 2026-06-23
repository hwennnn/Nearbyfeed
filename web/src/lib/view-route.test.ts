import { describe, expect, it } from 'vitest';
import {
  getRoutedViewFromLocation,
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

  it.each([
    ['/map', 'map'],
    ['/create', 'create'],
    ['/profile', 'profile'],
    ['/feed', 'feed'],
    ['/not-a-view', 'feed'],
  ])('parses pathname %s as %s', (pathname, expected) => {
    expect(getRoutedViewFromLocation({ hash: '', pathname, search: '' })).toBe(
      expected,
    );
  });

  it('keeps legacy view params working while clean routes roll out', () => {
    expect(
      getRoutedViewFromLocation({
        hash: '',
        pathname: '/',
        search: '?view=map',
      }),
    ).toBe('map');
  });

  it('keeps feed URLs clean and clears stale post deep links', () => {
    expect(
      getViewRouteUrl({
        hash: '',
        pathname: '/map',
        search: '?view=map&post=42&distance=500',
      }, 'feed'),
    ).toBe('/?distance=500');
  });

  it('sets clean routable paths while preserving unrelated URL state', () => {
    expect(
      getViewRouteUrl({
        hash: '#nearby',
        pathname: '/',
        search: '?post=42&distance=500&view=feed',
      }, 'map'),
    ).toBe('/map?distance=500#nearby');
  });
});
