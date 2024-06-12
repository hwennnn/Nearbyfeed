import { IsLatitude, IsLongitude, IsString } from 'class-validator';

export class CreateLocationDto {
  @IsString()
  name: string;

  @IsString()
  formattedAddress: string;

  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;
}
