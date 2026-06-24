import { getOpenMapsPayload } from './location-card-presentation';

describe('mobile location card', () => {
  it('opens maps at the attached post location instead of a hard-coded fallback', () => {
    expect(
      getOpenMapsPayload({
        formattedAddress: '5100 N Francisco Ave, Chicago, IL',
        latitude: 41.9742,
        longitude: -87.7019,
        name: 'River Park',
      }),
    ).toEqual({
      latitude: 41.9742,
      longitude: -87.7019,
      query: '5100 N Francisco Ave, Chicago, IL',
    });
  });
});
