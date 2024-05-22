import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNumberString,
  IsString,
  Length,
  Validate,
} from 'class-validator';
import { ValidNumberRangeValue } from 'src/posts/decorators';

export class CreatePollDto {
  @IsNumberString()
  @Validate(ValidNumberRangeValue, [1, 7])
  votingLength: number;

  @IsArray()
  @IsString({ each: true })
  @Length(1, 70, { each: true })
  @ArrayMinSize(2)
  @ArrayMaxSize(7)
  options: string[];
}
