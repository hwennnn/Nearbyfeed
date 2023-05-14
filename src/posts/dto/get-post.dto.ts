import {
  IsLatitude,
  IsLongitude,
  IsNumberString,
  IsOptional,
  IsString,
  Validate,
} from 'class-validator';
import {
  ValidDistanceRangeValue,
  ValidNumberRangeValue,
} from 'src/posts/decorators';

export class GetPostDto {
  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  @IsNumberString()
  @Validate(ValidDistanceRangeValue)
  distance: number;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsNumberString()
  @Validate(ValidNumberRangeValue, [15, 25])
  take?: number;

  userId?: string;
}
