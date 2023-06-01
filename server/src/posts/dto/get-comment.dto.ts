import {
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
  Validate,
} from 'class-validator';
import { ValidNumberRangeValue } from 'src/posts/decorators';

export enum GetCommentsSort {
  LATEST = 'latest',
  OLDEST = 'oldest',
}

export class GetCommentDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsNumberString()
  @Validate(ValidNumberRangeValue, [15, 25])
  take?: number;

  @IsOptional()
  @IsString()
  @IsEnum(GetCommentsSort)
  sort?: string;
}
