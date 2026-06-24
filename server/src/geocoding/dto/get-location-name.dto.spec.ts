import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { GetLocationNameDto } from './get-location-name.dto';

const validateDto = async (query: Record<string, unknown>) => {
  const dto = plainToInstance(GetLocationNameDto, query, {
    enableImplicitConversion: true,
  });
  const errors = await validate(dto, {
    forbidUnknownValues: false,
    whitelist: true,
  });

  return { dto, errors };
};

describe('GetLocationNameDto', () => {
  it('accepts numeric coordinate strings', async () => {
    const { dto, errors } = await validateDto({
      latitude: '37.323',
      longitude: '-122.0322',
    });

    expect(errors).toHaveLength(0);
    expect(dto.latitude).toBe(37.323);
    expect(dto.longitude).toBe(-122.0322);
  });

  it.each(['latitude', 'longitude'])(
    'rejects blank geocoding coordinate %s',
    async (field) => {
      const { errors } = await validateDto({
        latitude: '37.323',
        longitude: '-122.0322',
        [field]: '',
      });

      expect(errors.map((error) => error.property)).toContain(field);
    },
  );
});
