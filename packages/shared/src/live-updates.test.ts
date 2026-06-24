import { describe, expect, it } from 'vitest';
import { normalizeLiveUpdates } from './index';

describe('shared live update normalization', () => {
  it('canonicalizes X status updates and bounds text, tags, and duplicates', () => {
    const updates = normalizeLiveUpdates({
      updates: [
        {
          title: ` ${'A'.repeat(140)} `,
          summary: ` ${'B'.repeat(320)} `,
          url: 'https://x.com/example/status/42?s=20#noise',
          occurredAt: 'not-a-date',
          tags: [' food ', 'food', 'x'.repeat(60), 42, 'queue'],
        },
        {
          title: 'Duplicate link',
          summary: 'Same post with tracking.',
          url: 'https://x.com/example/status/42?utm_source=copy',
          tags: [],
        },
        {
          title: 'Search page',
          summary: 'Not a source post.',
          url: 'https://x.com/search?q=cupertino',
          tags: [],
        },
      ],
    });

    expect(updates).toEqual([
      expect.objectContaining({
        occurredAt: null,
        source: 'x',
        tags: ['food', `${'x'.repeat(21)}...`, 'queue'],
        url: 'https://x.com/example/status/42',
      }),
    ]);
    expect(updates[0].id).toBe('x-0-aHR0cHM6Ly94LmNvbS9leGFtcGxlL3N0YXR1cy80Mg');
    expect(updates[0].title).toHaveLength(90);
    expect(updates[0].title).toMatch(/\.\.\.$/);
    expect(updates[0].summary).toHaveLength(240);
    expect(updates[0].summary).toMatch(/\.\.\.$/);
  });

  it('accepts direct arrays and encoded JSON result payloads', () => {
    expect(
      normalizeLiveUpdates(
        '{"updates":[{"title":"Cafe line","summary":"People say it cleared.","url":"https://x.com/example/status/99","occurredAt":"2026-06-23T07:00:00.000Z","tags":["food"]}]}',
      ),
    ).toEqual([
      expect.objectContaining({
        occurredAt: '2026-06-23T07:00:00.000Z',
        tags: ['food'],
        title: 'Cafe line',
      }),
    ]);

    expect(
      normalizeLiveUpdates([
        {
          title: 'Direct array item',
          summary: 'Still valid.',
          url: 'https://x.com/example/status/100',
        },
      ]),
    ).toHaveLength(1);
  });
});
