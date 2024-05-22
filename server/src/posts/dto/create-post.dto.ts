import { Type } from 'class-transformer';
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
import { CreatePollDto } from './create-poll.dto';

export class CreatePostDto {
  @IsString()
  @MinLength(4)
  @MaxLength(70)
  title: string;

  @IsOptional()
  @IsString()
  @MinLength(15)
  @MaxLength(1000)
  content: string;

  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CreatePollDto)
  poll: CreatePollDto;
}
