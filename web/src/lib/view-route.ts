import { type View } from '../app-types';

const ROUTABLE_VIEWS = ['feed', 'map', 'create', 'profile'] as const;

type RoutableView = (typeof ROUTABLE_VIEWS)[number];

type RouteLocation = Pick<Location, 'hash' | 'pathname' | 'search'>;

export const isRoutableView = (value: string): value is RoutableView =>
  ROUTABLE_VIEWS.includes(value as RoutableView);

export const getRoutedViewFromSearch = (
  search = globalThis.location?.search ?? '',
): View => {
  const view = new URLSearchParams(search).get('view');

  return view !== null && isRoutableView(view) ? view : 'feed';
};

export const getViewRouteUrl = (
  location: RouteLocation,
  view: View,
): string => {
  const searchParams = new URLSearchParams(location.search);
  searchParams.delete('post');

  if (view === 'feed') {
    searchParams.delete('view');
  } else if (isRoutableView(view)) {
    searchParams.set('view', view);
  }

  const search = searchParams.toString();

  return `${location.pathname}${search.length > 0 ? `?${search}` : ''}${location.hash}`;
};
