import { Transform } from 'class-transformer';
import { IsNumber, Validate } from 'class-validator';
import { ValidVoteValue } from 'src/posts/decorators';
import { strictNumberTransform } from './strict-number.transform';

export class LikeDto {
  @Transform(strictNumberTransform)
  @IsNumber()
  @Validate(ValidVoteValue)
  value: number;
}
