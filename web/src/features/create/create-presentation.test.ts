import { describe, expect, it } from 'vitest';
import { getCreateDraftMetrics } from './create-presentation';

describe('create presentation helpers', () => {
  it('marks an empty draft as drafting and gives preview copy', () => {
    expect(
      getCreateDraftMetrics({
        content: '',
        filesCount: 0,
        locationName: 'Civic Center Park',
        pollEnabled: false,
        pollOptions: ['', ''],
        title: '',
      }),
    ).toEqual({
      filledPollOptions: 0,
      modeLabel: 'text signal',
      photoLabel: 'No photos yet',
      previewBody:
        'Posting from Civic Center Park. Add a little context so people nearby know what to do next.',
      previewTitle: 'What is happening nearby?',
      readinessLabel: 'drafting',
      readinessTone: 'draft',
      titleRemaining: 70,
    });
  });

  it('marks a valid text-only post as ready', () => {
    expect(
      getCreateDraftMetrics({
        content: 'Line is short right now.',
        filesCount: 0,
        locationName: 'Civic Center Park',
        pollEnabled: false,
        pollOptions: ['', ''],
        title: 'Food truck just opened',
      }),
    ).toMatchObject({
      modeLabel: 'text signal',
      previewTitle: 'Food truck just opened',
      readinessLabel: 'ready',
      readinessTone: 'ready',
    });
  });

  it('marks posts with photos or valid polls as richer signals', () => {
    expect(
      getCreateDraftMetrics({
        content: 'Vote before everyone heads over.',
        filesCount: 0,
        locationName: 'Library steps',
        pollEnabled: true,
        pollOptions: ['pull up', 'skip it', 'later'],
        title: 'Open mic is about to start',
      }),
    ).toMatchObject({
      filledPollOptions: 3,
      modeLabel: '3 poll options',
      readinessLabel: 'ready to pop',
      readinessTone: 'rich',
    });

    expect(
      getCreateDraftMetrics({
        content: '',
        filesCount: 1,
        locationName: 'Library steps',
        pollEnabled: false,
        pollOptions: ['', ''],
        title: 'Sunset crowd by the stage',
      }),
    ).toMatchObject({
      modeLabel: 'photo signal',
      photoLabel: '1 photo',
      readinessTone: 'rich',
    });
  });
});
