import { Logger } from '@nestjs/common';
import { ApiService } from 'src/api/api.service';
import { GeocodingService } from './geocoding.service';

const makeService = () => {
  const apiService = {
    get: jest.fn(),
  } as unknown as jest.Mocked<ApiService>;
  const logger = {
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as jest.Mocked<Logger>;

  return {
    apiService,
    logger,
    service: new GeocodingService(apiService, logger),
  };
};

describe('GeocodingService', () => {
  it('sends a Nominatim user agent when reverse geocoding', async () => {
    const { apiService, service } = makeService();
    apiService.get.mockResolvedValue({
      display_name: 'Cupertino, Santa Clara County, California',
    } as never);

    await service.getLocationName(37.323, -122.0322);

    expect(apiService.get).toHaveBeenCalledWith(
      '/reverse',
      {
        lat: 37.323,
        lon: -122.0322,
        format: 'json',
      },
      expect.objectContaining({
        'User-Agent': expect.stringContaining('NearbyFeed'),
      }),
    );
  });

  it('returns null and warns without error logging when the upstream rejects lookup', async () => {
    const { apiService, logger, service } = makeService();
    apiService.get.mockRejectedValue({ response: { status: 403 } });

    await expect(service.getLocationName(37.323, -122.0322)).resolves.toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('status 403'),
      GeocodingService.name,
    );
    expect(logger.error).not.toHaveBeenCalled();
  });
});
