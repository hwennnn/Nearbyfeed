import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if (data !== undefined) {
      return request.user[data];
    }
    return request.user;
  },
);
