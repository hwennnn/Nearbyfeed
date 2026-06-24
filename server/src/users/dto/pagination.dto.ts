import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Validate,
} from 'class-validator';
import { ValidNumberRangeValue } from 'src/posts/decorators';
import { strictNumberTransform } from 'src/posts/dto/strict-number.transform';

export class PaginationDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Transform(strictNumberTransform)
  @IsInt()
  @Validate(ValidNumberRangeValue, [15, 25])
  take?: number;
}
