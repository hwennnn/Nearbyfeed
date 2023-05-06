import { IsLatitude, IsLongitude, IsNumberString } from 'class-validator';

export class GetPostDto {
  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  @IsNumberString()
  distance: number;
}
