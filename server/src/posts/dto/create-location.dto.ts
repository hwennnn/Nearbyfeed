import { Transform } from 'class-transformer';
import { IsLatitude, IsLongitude, IsString } from 'class-validator';
import { strictNumberTransform } from './strict-number.transform';

export class CreateLocationDto {
  @IsString()
  name: string;

  @IsString()
  formattedAddress: string;

  @IsLatitude()
  @Transform(strictNumberTransform)
  latitude: number;

  @IsLongitude()
  @Transform(strictNumberTransform)
  longitude: number;
}
