import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { GetPostsDto } from './get-post.dto';

const validateDto = async (query: Record<string, unknown>) => {
  const dto = plainToInstance(GetPostsDto, query, {
    enableImplicitConversion: true,
  });
  const errors = await validate(dto, {
    forbidUnknownValues: false,
    whitelist: true,
  });

  return { dto, errors };
};

describe('GetPostsDto', () => {
  it('accepts numeric strings for nearby feed coordinates and filters', async () => {
    const { dto, errors } = await validateDto({
      latitude: '37.323',
      longitude: '-122.0322',
      distance: '200',
      take: '15',
      timeWindow: '24h',
    });

    expect(errors).toHaveLength(0);
    expect(dto.latitude).toBe(37.323);
    expect(dto.longitude).toBe(-122.0322);
    expect(dto.distance).toBe(200);
    expect(dto.take).toBe(15);
  });

  it.each(['latitude', 'longitude', 'distance', 'take'])(
    'rejects blank numeric query field %s',
    async (field) => {
      const { errors } = await validateDto({
        latitude: '37.323',
        longitude: '-122.0322',
        distance: '200',
        [field]: '',
      });

      expect(errors.map((error) => error.property)).toContain(field);
    },
  );
});
