import { IsString, MaxLength, MinLength } from 'class-validator';
import { POST_LIMITS } from '@nearbyfeed/shared';

export class CreateCommentDto {
  @IsString()
  @MinLength(POST_LIMITS.commentMin)
  @MaxLength(POST_LIMITS.commentMax)
  content: string;
}
