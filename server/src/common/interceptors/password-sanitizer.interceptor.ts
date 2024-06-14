import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { tap } from 'rxjs';
import { sanitize } from 'src/utils/general.utils';

@Injectable()
export class PasswordSanitizerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler<any>): any {
    return next.handle().pipe(tap((data) => sanitize(data, 'password')));
  }
}
