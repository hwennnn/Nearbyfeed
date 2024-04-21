import { IsNumber, Validate } from 'class-validator';
import { ValidVoteValue } from 'src/posts/decorators';

export class LikeDto {
  @IsNumber()
  @Validate(ValidVoteValue)
  value: number;
}
