import { Injectable, Logger } from '@nestjs/common';
import { ApiService } from 'src/api/api.service';
import { type GeolocationName, type Place } from 'src/geocoding/entities';

const NOMINATIM_HEADERS = {
  'Accept-Language': 'en',
  'User-Agent': 'NearbyFeed/1.0 (https://nearbyfeed.com)',
};

@Injectable()
export class GeocodingService {
  constructor(
    private readonly apiService: ApiService,
    private readonly logger: Logger,
  ) {}

  async getLocationName(
    latitude: number,
    longitude: number,
  ): Promise<GeolocationName | null> {
    const data = await this.apiService
      .get<Place>('/reverse', {
        lat: latitude,
        lon: longitude,
        format: 'json',
      },
      NOMINATIM_HEADERS)
      .catch((e) => {
        const status = this.getErrorStatus(e);
        this.logger.warn(
          status === undefined
            ? 'Failed to fetch location name'
            : `Failed to fetch location name (status ${status})`,
          GeocodingService.name,
        );

        // return null if not able to fetch the location name
        return null;
      });

    if (data === null) return null;

    const names = data.display_name.split(', ');

    return names.length > 0
      ? {
          locationName: names.slice(0, 2).join(', '),
          displayName: data.display_name,
        }
      : null;
  }

  private getErrorStatus(error: unknown): number | undefined {
    if (typeof error !== 'object' || error === null || !('response' in error)) {
      return undefined;
    }

    return (error as { response?: { status?: number } }).response?.status;
  }
}
