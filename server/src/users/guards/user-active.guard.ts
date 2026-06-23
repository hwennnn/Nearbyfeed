import {
  Injectable,
  NotFoundException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { parseRouteId } from 'src/utils/parse-route-id.util';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class UserActiveGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userIdFromToken = parseRouteId(request.user.userId, 'userId');

    const user = await this.usersService.findActiveStateById(userIdFromToken);

    if (user === null || user.isDeleted) {
      throw new NotFoundException('User not found');
    }

    return true;
  }
}
