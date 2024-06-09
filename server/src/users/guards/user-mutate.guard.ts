import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';

@Injectable()
export default class UserMutateGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userIdFromParams = +request.params.id;
    const userIdFromToken = +request.user.userId;

    const user = await this.usersService.findOne(userIdFromToken);

    if (user === null || user.isDeleted) {
      throw new NotFoundException('User not found');
    }

    if (userIdFromParams !== userIdFromToken) {
      throw new ForbiddenException('No permission');
    }

    return true;
  }
}
