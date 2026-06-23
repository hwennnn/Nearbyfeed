import { MapPin, X } from 'lucide-react';
import { type CreatePlaceTag } from './create-payload';

export const PlaceTagEditor = ({
  locationName,
  onPlaceTagChange,
  placeTag,
}: {
  locationName: string;
  onPlaceTagChange: (placeTag: CreatePlaceTag) => void;
  placeTag: CreatePlaceTag;
}) => {
  const hasPlaceTag = placeTag.name.trim().length > 0;

  return (
    <div className={`place-tag-editor ${hasPlaceTag ? 'is-tagged' : ''}`}>
      <div className="place-tag-head">
        <MapPin />
        <span>
          <strong>{hasPlaceTag ? 'Specific spot' : 'Tag a specific spot'}</strong>
          <em>{hasPlaceTag ? placeTag.name : `Defaults to ${locationName}`}</em>
        </span>
        {hasPlaceTag && (
          <button
            className="icon-button"
            onClick={() => onPlaceTagChange({ name: '', formattedAddress: '' })}
            title="Clear place"
            type="button"
          >
            <X />
          </button>
        )}
      </div>
      <div className="place-tag-fields">
        <input
          onChange={(event) =>
            onPlaceTagChange({
              ...placeTag,
              name: event.target.value,
            })
          }
          placeholder="Place name"
          value={placeTag.name}
        />
        <input
          onChange={(event) =>
            onPlaceTagChange({
              ...placeTag,
              formattedAddress: event.target.value,
            })
          }
          placeholder="Address or landmark"
          value={placeTag.formattedAddress}
        />
      </div>
    </div>
  );
};
