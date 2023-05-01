import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { type CreateUserDto } from 'src/users/dto';
import { UsersService } from 'src/users/users.service';
import { hashPassword } from 'src/utils';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly logger: Logger,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<string> {
    const userExists = await this.usersService.isUserExistByEmail(
      createUserDto.email,
    );

    if (userExists) {
      throw new BadRequestException('User already exists');
    }

    const data = {
      ...createUserDto,
      password: await hashPassword(createUserDto.password),
    };

    const user = await this.usersService.create(data);
    const uid = user.id;

    return uid.toString();
  }
}
