import { Transform } from 'class-transformer';
import { IsLatitude, IsLongitude } from 'class-validator';
import { strictNumberTransform } from 'src/posts/dto/strict-number.transform';

export class GetLocationNameDto {
  @IsLatitude()
  @Transform(strictNumberTransform)
  latitude: number;

  @IsLongitude()
  @Transform(strictNumberTransform)
  longitude: number;
}
