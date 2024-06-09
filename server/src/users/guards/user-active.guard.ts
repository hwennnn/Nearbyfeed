import {
  Injectable,
  NotFoundException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';

@Injectable()
export default class UserActiveGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userIdFromToken = +request.user.userId;

    const user = await this.usersService.findOne(userIdFromToken);

    if (user === null) {
      throw new NotFoundException('User not found');
    }

    if (user.isDeleted === true) {
      throw new NotFoundException('User has been deleted');
    }

    return true;
  }
}
