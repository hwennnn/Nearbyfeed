import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Validate,
} from 'class-validator';
import { ValidNumberRangeValue } from 'src/posts/decorators';

export class PaginationDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Validate(ValidNumberRangeValue, [15, 25])
  take?: number;
}
