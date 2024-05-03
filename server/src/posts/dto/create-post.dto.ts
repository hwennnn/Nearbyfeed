import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsLatitude,
  IsLongitude,
  IsNumberString,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
  Validate,
} from 'class-validator';
import { ValidNumberRangeValue } from 'src/posts/decorators';

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
  @IsNumberString()
  @Validate(ValidNumberRangeValue, [1, 7])
  votingLength: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Length(1, 70, { each: true })
  @ArrayMinSize(2)
  @ArrayMaxSize(7)
  options: string[];
}
