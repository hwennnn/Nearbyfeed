import {
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePostDto {
  @IsString()
  @MinLength(4)
  @MaxLength(50)
  title: string;

  @IsOptional()
  @IsString()
  @MinLength(15)
  @MaxLength(500)
  content: string;

  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;
}
