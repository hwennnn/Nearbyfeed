import { Injectable } from '@nestjs/common';
import { type ExecutionContext } from '@nestjs/common/interfaces';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
    status?: any,
  ): any {
    // Do not throw an error if user is not authenticated
    if (err !== null || user === false) {
      return null;
    }

    return user;
  }
}
