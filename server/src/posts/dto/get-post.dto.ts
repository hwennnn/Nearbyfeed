import { Type } from 'class-transformer';
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

export class GetPostsDto {
  @IsLatitude()
  @Type(() => Number)
  latitude: number;

  @IsLongitude()
  @Type(() => Number)
  longitude: number;

  @Type(() => Number)
  @IsInt()
  @Validate(ValidDistanceRangeValue)
  distance: number;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Validate(ValidNumberRangeValue, [15, 25])
  take?: number;

  @IsOptional()
  @IsIn(TIME_WINDOW_VALUES)
  timeWindow?: TimeWindow;

  userId?: string;
}
