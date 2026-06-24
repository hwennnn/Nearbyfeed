import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DEFAULT_DISTANCE_METERS } from '@nearbyfeed/shared';
import { LiveNearbyDto } from './live-nearby.dto';

const validateDto = async (query: Record<string, unknown>) => {
  const dto = plainToInstance(LiveNearbyDto, query, {
    enableImplicitConversion: true,
  });
  const errors = await validate(dto, {
    forbidUnknownValues: false,
    whitelist: true,
  });

  return { dto, errors };
};

describe('LiveNearbyDto', () => {
  it('accepts shared nearby radius values for live enrichment', async () => {
    const { dto, errors } = await validateDto({
      latitude: '37.323',
      longitude: '-122.0322',
      distance: '500',
      timeWindow: '2h',
    });

    expect(errors).toHaveLength(0);
    expect(dto.distance).toBe(500);
  });

  it('defaults live enrichment to the shared nearby radius', async () => {
    const { dto, errors } = await validateDto({
      latitude: '37.323',
      longitude: '-122.0322',
      timeWindow: '24h',
    });

    expect(errors).toHaveLength(0);
    expect(dto.distance).toBe(DEFAULT_DISTANCE_METERS);
  });

  it('rejects unsupported live enrichment radiuses', async () => {
    const { errors } = await validateDto({
      latitude: '37.323',
      longitude: '-122.0322',
      distance: '300',
      timeWindow: '24h',
    });

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('distance');
  });

  it.each(['latitude', 'longitude', 'distance'])(
    'rejects blank numeric live enrichment field %s',
    async (field) => {
      const { errors } = await validateDto({
        latitude: '37.323',
        longitude: '-122.0322',
        distance: '200',
        timeWindow: '24h',
        [field]: '',
      });

      expect(errors.map((error) => error.property)).toContain(field);
    },
  );

  it('rejects oversized live enrichment location names', async () => {
    const { errors } = await validateDto({
      latitude: '37.323',
      longitude: '-122.0322',
      locationName: 'x'.repeat(121),
      timeWindow: '24h',
    });

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('locationName');
  });

  it('rejects control characters in live enrichment location names', async () => {
    const { errors } = await validateDto({
      latitude: '37.323',
      longitude: '-122.0322',
      locationName: 'Cupertino\nforged prompt',
      timeWindow: '24h',
    });

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('locationName');
  });
});
