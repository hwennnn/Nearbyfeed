import { Transform, Type } from 'class-transformer';
import { POST_LIMITS } from '@nearbyfeed/shared';
import {
  IsLatitude,
  IsLongitude,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CreateLocationDto } from './create-location.dto';
import { CreatePollDto } from './create-poll.dto';
import { strictNumberTransform } from './strict-number.transform';

export class CreatePostDto {
  @IsString()
  @MinLength(POST_LIMITS.titleMin)
  @MaxLength(POST_LIMITS.titleMax)
  title: string;

  @IsOptional()
  @IsString()
  @MinLength(POST_LIMITS.contentMin)
  @MaxLength(POST_LIMITS.contentMax)
  content: string;

  @IsLatitude()
  @Transform(strictNumberTransform)
  latitude: number;

  @IsLongitude()
  @Transform(strictNumberTransform)
  longitude: number;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CreatePollDto)
  poll: CreatePollDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CreateLocationDto)
  location: CreateLocationDto;
}
