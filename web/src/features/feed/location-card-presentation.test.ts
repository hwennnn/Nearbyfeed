import { describe, expect, it } from 'vitest';
import { getLocationCardModel } from './location-card-presentation';

describe('location card presentation', () => {
  it('formats map metadata from post coordinates', () => {
    expect(
      getLocationCardModel({
        formattedAddress: '5100 N Francisco Ave, Chicago, IL',
        latitude: 41.9742,
        longitude: -87.7019,
        name: 'River Park',
      }),
    ).toEqual({
      actionLabel: 'Open',
      coordinateLabel: '41.9742, -87.7019',
      mapTarget: {
        latitude: 41.9742,
        longitude: -87.7019,
        query: '5100 N Francisco Ave, Chicago, IL',
      },
      mapSearchUrl:
        'https://www.google.com/maps/search/?api=1&query=41.9742%2C-87.7019',
      microLabel: 'Place tag',
      privacyLabel: 'Precise pin',
    });
  });
});
