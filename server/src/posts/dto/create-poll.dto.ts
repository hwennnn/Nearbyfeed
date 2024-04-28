import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsString,
  Length,
  Validate,
} from 'class-validator';
import { ValidNumberRangeValue } from 'src/posts/decorators';

export class CreatePollDto {
  @IsNumber()
  @Validate(ValidNumberRangeValue, [1, 7])
  votingLength: number;

  @IsArray()
  @IsString({ each: true })
  @Length(1, 120, { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  options: string[];
}
