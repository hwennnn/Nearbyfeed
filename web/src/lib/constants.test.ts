import { describe, expect, it } from 'vitest';
import { normalizeMapboxAccessToken } from './constants';

describe('runtime constants', () => {
  it('normalizes missing and blank Mapbox tokens to an empty value', () => {
    expect(normalizeMapboxAccessToken(undefined)).toBe('');
    expect(normalizeMapboxAccessToken('   ')).toBe('');
  });

  it('trims configured Mapbox tokens before booting the map', () => {
    expect(normalizeMapboxAccessToken(' pk.public-token ')).toBe(
      'pk.public-token',
    );
  });
});
