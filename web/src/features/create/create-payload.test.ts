import { describe, expect, it } from 'vitest';
import {
  DEFAULT_POLL_VOTING_LENGTH_DAYS,
  buildCreatePostInput,
} from './create-payload';

const coordinates = {
  latitude: 37.323,
  longitude: -122.0322,
};

describe('create post payload builder', () => {
  it('uses the current area as the default location tag', () => {
    expect(
      buildCreatePostInput({
        content: 'Tiny projector night is drawing a crowd.',
        coordinates,
        files: [],
        locationName: 'Cupertino Library',
        placeTag: { name: '', formattedAddress: '' },
        pollEnabled: false,
        pollOptions: ['', ''],
        pollVotingLengthDays: DEFAULT_POLL_VOTING_LENGTH_DAYS,
        title: 'Library steps are buzzing',
      }),
    ).toMatchObject({
      content: 'Tiny projector night is drawing a crowd.',
      coordinates,
      images: [],
      location: {
        formattedAddress: 'Cupertino Library',
        latitude: 37.323,
        longitude: -122.0322,
        name: 'Cupertino Library',
      },
      title: 'Library steps are buzzing',
    });
  });

  it('attaches a specific place tag and mobile-compatible poll duration', () => {
    expect(
      buildCreatePostInput({
        content: 'Vote before everyone walks over.',
        coordinates,
        files: [],
        locationName: 'Cupertino',
        placeTag: {
          formattedAddress: '10800 Torre Ave, Cupertino',
          name: 'Civic Center Plaza',
        },
        pollEnabled: true,
        pollOptions: ['pull up', 'skip it', ''],
        pollVotingLengthDays: 5,
        title: 'Open mic line is forming',
      }),
    ).toMatchObject({
      location: {
        formattedAddress: '10800 Torre Ave, Cupertino',
        latitude: 37.323,
        longitude: -122.0322,
        name: 'Civic Center Plaza',
      },
      poll: {
        options: ['pull up', 'skip it'],
        votingLength: 5,
      },
    });
  });

  it('omits blank optional content and disabled polls', () => {
    const payload = buildCreatePostInput({
      content: '   ',
      coordinates,
      files: [],
      locationName: 'Cupertino',
      placeTag: { name: '', formattedAddress: '' },
      pollEnabled: false,
      pollOptions: ['pull up', 'skip it'],
      pollVotingLengthDays: 5,
      title: 'Open mic line is forming',
    });

    expect(payload.content).toBeUndefined();
    expect(payload.poll).toBeUndefined();
  });
});
