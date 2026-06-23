import { describe, expect, it } from 'vitest';
import { getOversizedAppChunks } from './chunk-budget';

const makeChunk = (name: string, sizeBytes: number) => ({
  type: 'chunk' as const,
  fileName: `assets/${name}-hash.js`,
  name,
  code: 'x'.repeat(sizeBytes),
});

describe('chunk budget helpers', () => {
  it('allows the lazy Mapbox SDK chunk to exceed the normal app budget', () => {
    expect(
      getOversizedAppChunks({
        'assets/mapbox-hash.js': makeChunk('mapbox', 1_900_000),
      }),
    ).toEqual([]);
  });

  it('flags app-owned chunks that exceed the normal budget', () => {
    expect(
      getOversizedAppChunks({
        'assets/index-hash.js': makeChunk('index', 530 * 1024),
        'assets/MapView-hash.js': makeChunk('MapView', 18 * 1024),
      }),
    ).toEqual([
      {
        fileName: 'assets/index-hash.js',
        name: 'index',
        sizeKb: 530,
      },
    ]);
  });
});
