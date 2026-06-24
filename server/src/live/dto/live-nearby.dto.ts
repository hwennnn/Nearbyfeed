import { Transform } from 'class-transformer';
import {
  IsInt,
  IsIn,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Validate,
} from 'class-validator';
import {
  DEFAULT_DISTANCE_METERS,
  DEFAULT_TIME_WINDOW,
  type DistanceMeters,
  TIME_WINDOW_VALUES,
  type TimeWindow,
} from '@nearbyfeed/shared';
import { ValidDistanceRangeValue } from 'src/posts/decorators';
import { strictNumberTransform } from 'src/posts/dto/strict-number.transform';

export class LiveNearbyDto {
  @IsLatitude()
  @Transform(strictNumberTransform)
  latitude: number;

  @IsLongitude()
  @Transform(strictNumberTransform)
  longitude: number;

  @IsOptional()
  @Transform(strictNumberTransform)
  @IsInt()
  @Validate(ValidDistanceRangeValue)
  distance?: DistanceMeters = DEFAULT_DISTANCE_METERS;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Matches(/^[^\u0000-\u001F\u007F]*$/)
  locationName?: string;

  @IsOptional()
  @IsIn(TIME_WINDOW_VALUES)
  timeWindow: TimeWindow = DEFAULT_TIME_WINDOW;
}
