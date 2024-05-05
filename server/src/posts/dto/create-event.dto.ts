import {
  IsDateString,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Validate,
} from 'class-validator';
import { IsDateAfterConstraint } from 'src/posts/decorators';

export class CreateEventDto {
  @IsString()
  @MinLength(4)
  @MaxLength(100)
  title: string;

  @IsOptional()
  @IsString()
  @MinLength(15)
  @MaxLength(500)
  description: string;

  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @Validate(IsDateAfterConstraint, ['startDate'])
  @IsDateString()
  endDate: string;

  @IsString()
  locationName: string;

  @IsString()
  fullLocationName: string;
}
