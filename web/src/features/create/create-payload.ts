import { type CreatePostInput } from '../../lib/api';
import { type Coordinates } from '../../types';

export const DEFAULT_POLL_VOTING_LENGTH_DAYS = 5;

export type CreatePlaceTag = {
  formattedAddress: string;
  name: string;
};

export type CreateDraftPayloadInput = {
  content: string;
  coordinates: Coordinates;
  files: File[];
  locationName: string;
  placeTag: CreatePlaceTag;
  pollEnabled: boolean;
  pollOptions: string[];
  pollVotingLengthDays: number;
  title: string;
};

export const buildCreatePostInput = ({
  content,
  coordinates,
  files,
  locationName,
  placeTag,
  pollEnabled,
  pollOptions,
  pollVotingLengthDays,
  title,
}: CreateDraftPayloadInput): CreatePostInput => {
  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();
  const placeName = placeTag.name.trim();
  const placeAddress = placeTag.formattedAddress.trim();
  const effectivePlaceName = placeName.length > 0 ? placeName : locationName;
  const effectivePlaceAddress =
    placeAddress.length > 0 ? placeAddress : effectivePlaceName;
  const filledPollOptions = pollOptions
    .map((option) => option.trim())
    .filter(Boolean);

  return {
    title: trimmedTitle,
    content: trimmedContent.length > 0 ? trimmedContent : undefined,
    coordinates,
    images: files,
    poll:
      pollEnabled && filledPollOptions.length > 0
        ? {
            votingLength: pollVotingLengthDays,
            options: filledPollOptions,
          }
        : undefined,
    location: {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      name: effectivePlaceName,
      formattedAddress: effectivePlaceAddress,
    },
  };
};
