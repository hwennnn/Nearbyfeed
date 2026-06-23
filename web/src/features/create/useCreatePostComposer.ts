import { useMutation } from '@tanstack/react-query';
import { getCreatePostValidationError } from '@nearbyfeed/shared';
import { useState } from 'react';
import { captureEvent, createPost } from '../../lib/api';
import { type Coordinates } from '../../types';
import {
  DEFAULT_POLL_VOTING_LENGTH_DAYS,
  buildCreatePostInput,
  type CreatePlaceTag,
} from './create-payload';

export const useCreatePostComposer = ({
  coordinates,
  locationName,
  onCreated,
}: {
  coordinates: Coordinates;
  locationName: string;
  onCreated: () => void;
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [pollEnabled, setPollEnabled] = useState(false);
  const [options, setOptions] = useState(['', '']);
  const [pollVotingLengthDays, setPollVotingLengthDays] = useState(
    DEFAULT_POLL_VOTING_LENGTH_DAYS,
  );
  const [placeTag, setPlaceTag] = useState<CreatePlaceTag>({
    formattedAddress: '',
    name: '',
  });
  const validationError = getCreatePostValidationError({
    content,
    pollEnabled,
    pollOptions: options,
    title,
  });
  const displayLocationName = placeTag.name.trim() || locationName;
  const mutation = useMutation({
    mutationFn: async () =>
      await createPost(
        buildCreatePostInput({
          title,
          content,
          coordinates,
          files,
          locationName,
          placeTag,
          pollEnabled,
          pollOptions: options,
          pollVotingLengthDays,
        }),
      ),
    onSuccess: () => {
      void captureEvent(
        'web.post_created',
        {
          images: files.length,
          placeTagged: placeTag.name.trim().length > 0,
          pollEnabled,
          pollVotingLengthDays,
        },
        'create',
      );
      onCreated();
    },
  });

  return {
    content,
    displayLocationName,
    files,
    mutation,
    options,
    placeTag,
    pollEnabled,
    pollVotingLengthDays,
    setContent,
    setFiles,
    setOptions,
    setPlaceTag,
    setPollEnabled,
    setPollVotingLengthDays,
    setTitle,
    title,
    validationError,
  };
};
