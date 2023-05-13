import { Injectable, Logger } from '@nestjs/common';
import { ApiService } from 'src/api/api.service';
import { type GeolocationName, type Place } from 'src/geocoding/entities';

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
      })
      .catch((e) => {
        this.logger.error(
          'Failed to fetch location name',
          e instanceof Error ? e.stack : undefined,
          ApiService.name,
        );

        // return null if not able to fetch the location name
        return null;
      });

    if (data === null) return null;

    const names = data.display_name.split(', ');

    return names.length > 0
      ? {
          locationName: names[0],
          displayName: data.display_name,
        }
      : null;
  }
}
