export type FeedMedia = {
  type: string;
  url: string;
  w?: number;
  h?: number;
  embed_id?: string;
};

export type FeedItem = {
  id: number;
  source: string;
  kind: 'post' | 'video' | 'live' | 'event' | 'article' | 'alert';
  title: string;
  body: string | null;
  url: string | null;
  author_name: string | null;
  author_url: string | null;
  media: FeedMedia[];
  lat: number;
  lng: number;
  geo_method: string;
  geo_confidence: number;
  geo_radius_m: number;
  place_name: string | null;
  published_at: string;
  distance_m: number;
};

export type FeedPage = {
  items: FeedItem[];
  next_cursor?: string;
  radius_used: number;
};

export type Place = {
  lat: number;
  lng: number;
  label: string;
};

export const fetchFeed = async (
  place: Place,
  signal?: AbortSignal,
): Promise<FeedPage> => {
  const params = new URLSearchParams({
    lat: String(place.lat),
    lng: String(place.lng),
    window: '7d',
    limit: '30',
  });

  const response = await fetch(`/v1/feed?${params.toString()}`, { signal });
  if (!response.ok) {
    throw new Error(`Feed request failed with status ${response.status}`);
  }
  return (await response.json()) as FeedPage;
};
