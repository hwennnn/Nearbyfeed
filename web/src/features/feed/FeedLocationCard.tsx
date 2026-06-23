import { MapPin, Navigation } from 'lucide-react';
import { type Post } from '../../types';
import { getLocationCardModel } from './location-card-presentation';

export const FeedLocationCard = ({
  location,
}: {
  location: NonNullable<Post['location']>;
}) => {
  const model = getLocationCardModel(location);

  return (
    <a
      aria-label={`Open ${location.name} in maps`}
      className="location-card"
      href={model.mapSearchUrl}
      rel="noreferrer"
      target="_blank"
    >
      <span className="location-card-icon">
        <MapPin />
      </span>
      <span className="location-card-map-strip" aria-hidden="true">
        <span />
      </span>
      <span className="location-card-copy">
        <span className="location-card-kicker">{model.microLabel}</span>
        <strong>{location.name}</strong>
        <em>{location.formattedAddress}</em>
        <small>{model.coordinateLabel}</small>
      </span>
      <span className="location-card-action">
        <Navigation className="location-card-arrow" />
        <span>Maps</span>
      </span>
    </a>
  );
};
