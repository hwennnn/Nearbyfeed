import { COMMENT_SORT_VALUES, type CommentSort } from '@nearbyfeed/shared';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Validate,
} from 'class-validator';
import { ValidNumberRangeValue } from 'src/posts/decorators';

export class GetCommentDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Validate(ValidNumberRangeValue, [15, 25])
  take?: number;

  @IsOptional()
  @IsString()
  @IsIn(COMMENT_SORT_VALUES)
  sort?: CommentSort;

  userId?: string;
}

export class GetChildCommentDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Validate(ValidNumberRangeValue, [15, 25])
  take?: number;

  userId?: string;
}
