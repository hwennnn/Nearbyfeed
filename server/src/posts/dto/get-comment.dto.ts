import { COMMENT_SORT_VALUES, type CommentSort } from '@nearbyfeed/shared';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Validate,
} from 'class-validator';
import { ValidNumberRangeValue } from 'src/posts/decorators';
import { strictNumberTransform } from './strict-number.transform';

export class GetCommentDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Transform(strictNumberTransform)
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
  @Transform(strictNumberTransform)
  @IsInt()
  @Validate(ValidNumberRangeValue, [15, 25])
  take?: number;

  userId?: string;
}
