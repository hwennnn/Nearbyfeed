import { Injectable, UnauthorizedException } from '@nestjs/common';
import { type ExecutionContext } from '@nestjs/common/interfaces';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  forceRequestNewToken: boolean;

  constructor(forceRequestNewToken = false) {
    super();
    this.forceRequestNewToken = forceRequestNewToken;
  }

  handleRequest(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
    status?: any,
  ): any {
    // throw error so the client can request new tokens
    if (this.forceRequestNewToken && info?.name === 'TokenExpiredError') {
      throw new UnauthorizedException('Access token expired');
    }

    // Do not throw an error if user is not authenticated
    if (err !== null || user === false) {
      return null;
    }

    return user;
  }
}
