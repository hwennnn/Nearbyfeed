import { Injectable, Logger } from '@nestjs/common';
import { type CreateUserDto } from 'src/users/dto';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly logger: Logger,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<string> {
    const user = await this.usersService.create(createUserDto);
    const uid = user.id;

    return uid.toString();
  }
}
