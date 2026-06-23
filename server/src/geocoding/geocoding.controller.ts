import { Controller, Get, Query } from '@nestjs/common';
import { GetLocationNameDto } from './dto/get-location-name.dto';
import { type GeolocationName } from './entities';
import { GeocodingService } from './geocoding.service';

@Controller('geocoding')
export class GeocodingController {
  constructor(private readonly geocodingService: GeocodingService) {}

  @Get('location-name')
  async getLocationName(
    @Query() dto: GetLocationNameDto,
  ): Promise<GeolocationName | null> {
    return await this.geocodingService.getLocationName(
      dto.latitude,
      dto.longitude,
    );
  }
}
