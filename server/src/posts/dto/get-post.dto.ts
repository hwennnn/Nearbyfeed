import { Transform } from 'class-transformer';
import {
  IsInt,
  IsIn,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Validate,
} from 'class-validator';
import { TIME_WINDOW_VALUES, type TimeWindow } from '@nearbyfeed/shared';
import {
  ValidDistanceRangeValue,
  ValidNumberRangeValue,
} from 'src/posts/decorators';
import { strictNumberTransform } from './strict-number.transform';

export class GetPostsDto {
  @IsLatitude()
  @Transform(strictNumberTransform)
  latitude: number;

  @IsLongitude()
  @Transform(strictNumberTransform)
  longitude: number;

  @Transform(strictNumberTransform)
  @IsInt()
  @Validate(ValidDistanceRangeValue)
  distance: number;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Transform(strictNumberTransform)
  @IsInt()
  @Validate(ValidNumberRangeValue, [15, 25])
  take?: number;

  @IsOptional()
  @IsIn(TIME_WINDOW_VALUES)
  timeWindow?: TimeWindow;

  userId?: string;
}
