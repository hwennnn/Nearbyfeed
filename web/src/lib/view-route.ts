import { type View } from '../app-types';

const ROUTABLE_VIEWS = ['feed', 'map', 'create', 'profile'] as const;

type RoutableView = (typeof ROUTABLE_VIEWS)[number];

type RouteLocation = Pick<Location, 'hash' | 'pathname' | 'search'>;

const VIEW_PATHS = {
  create: '/create',
  feed: '/',
  map: '/map',
  profile: '/profile',
} satisfies Record<RoutableView, string>;

export const isRoutableView = (value: string): value is RoutableView =>
  ROUTABLE_VIEWS.includes(value as RoutableView);

export const getRoutedViewFromSearch = (
  search = globalThis.location?.search ?? '',
): View => {
  const view = new URLSearchParams(search).get('view');

  return view !== null && isRoutableView(view) ? view : 'feed';
};

export const getRoutedViewFromLocation = (
  location: RouteLocation = globalThis.location,
): View => {
  const searchView = getRoutedViewFromSearch(location.search);

  if (searchView !== 'feed') return searchView;

  const firstPathSegment = location.pathname.split('/').filter(Boolean)[0];

  return firstPathSegment !== undefined && isRoutableView(firstPathSegment)
    ? firstPathSegment
    : 'feed';
};

export const getViewRouteUrl = (
  location: RouteLocation,
  view: View,
): string => {
  const searchParams = new URLSearchParams(location.search);
  searchParams.delete('post');
  searchParams.delete('view');

  const pathname = isRoutableView(view) ? VIEW_PATHS[view] : location.pathname;

  const search = searchParams.toString();

  return `${pathname}${search.length > 0 ? `?${search}` : ''}${location.hash}`;
};
