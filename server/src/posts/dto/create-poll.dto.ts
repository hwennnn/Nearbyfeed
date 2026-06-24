import { Transform } from 'class-transformer';
import { POST_LIMITS } from '@nearbyfeed/shared';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  Length,
  Validate,
} from 'class-validator';
import { ValidNumberRangeValue } from 'src/posts/decorators';
import { strictNumberTransform } from './strict-number.transform';

export class CreatePollDto {
  @Transform(strictNumberTransform)
  @IsInt()
  @Validate(ValidNumberRangeValue, [1, 7])
  votingLength: number;

  @IsArray()
  @IsString({ each: true })
  @Length(POST_LIMITS.pollOptionMin, POST_LIMITS.pollOptionMax, {
    each: true,
  })
  @ArrayMinSize(POST_LIMITS.pollOptionsMin)
  @ArrayMaxSize(POST_LIMITS.pollOptionsMax)
  options: string[];
}
