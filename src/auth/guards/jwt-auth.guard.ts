import {
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { type Request } from 'express';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export default class JwtAuthGuard
  extends AuthGuard('jwt')
  implements CanActivate
{
  constructor(
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // this is necessary due to possibly returning `boolean | Promise<boolean> | Observable<boolean>
    const parentCanActivate = (await super.canActivate(context)) as boolean;

    if (!parentCanActivate) return false;

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (token === undefined) {
      throw new UnauthorizedException('Invalid token');
    }

    const tokenPayload: any = this.jwtService.decode(token);
    const storedRefreshToken = await this.redisService.get(
      tokenPayload.sessionId,
    );

    return storedRefreshToken !== null;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
