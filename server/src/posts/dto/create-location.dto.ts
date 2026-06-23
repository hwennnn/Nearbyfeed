import { Type } from 'class-transformer';
import { IsLatitude, IsLongitude, IsString } from 'class-validator';

export class CreateLocationDto {
  @IsString()
  name: string;

  @IsString()
  formattedAddress: string;

  @IsLatitude()
  @Type(() => Number)
  latitude: number;

  @IsLongitude()
  @Type(() => Number)
  longitude: number;
}
