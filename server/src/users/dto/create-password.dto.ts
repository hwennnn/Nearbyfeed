import { IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';

export class CreatePasswordDto {
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password: string;
}
