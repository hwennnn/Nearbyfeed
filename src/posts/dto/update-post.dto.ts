import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdatePostDto {
  @IsString()
  @MinLength(4)
  @MaxLength(25)
  title: string;

  @IsString()
  @MinLength(15)
  @MaxLength(100)
  content: string;
}
