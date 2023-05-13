import { Logger, Module } from '@nestjs/common';
import { ApiModule } from 'src/api/api.module';
import { NOMINATIM_OPENSTREETMAP_ENDPOINT } from 'src/geocoding/config';
import { GeocodingService } from './geocoding.service';

@Module({
  imports: [ApiModule.forRoot(NOMINATIM_OPENSTREETMAP_ENDPOINT)],
  providers: [GeocodingService, Logger],
  exports: [GeocodingService],
})
export class GeocodingModule {}
