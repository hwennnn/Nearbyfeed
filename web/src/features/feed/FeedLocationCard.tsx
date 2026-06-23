import { MapPin, Navigation } from 'lucide-react';
import { type Post } from '../../types';

const getMapSearchUrl = (location: NonNullable<Post['location']>): string => {
  const query = encodeURIComponent(`${location.latitude},${location.longitude}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
};

export const FeedLocationCard = ({
  location,
}: {
  location: NonNullable<Post['location']>;
}) => (
  <a
    aria-label={`Open ${location.name} in maps`}
    className="location-card"
    href={getMapSearchUrl(location)}
    rel="noreferrer"
    target="_blank"
  >
    <span className="location-card-icon">
      <MapPin />
    </span>
    <span className="location-card-copy">
      <strong>{location.name}</strong>
      <em>{location.formattedAddress}</em>
    </span>
    <Navigation className="location-card-arrow" />
  </a>
);
