import { createParamDecorator, ExecutionContext, HttpException } from '@nestjs/common';
import { RequestCtx } from '../types/request-ctx';

interface Options {
  optional?: boolean;
}

/**
 * Extracts the authenticated user from the context.
 * @example
 * foobar(@CurrentUser() user: User) {}
 * @throws HttpException when no user defined in the context
 */
export const CurrentUser = createParamDecorator((data: Options = {}, ctx: ExecutionContext) => {
  const { user } = ctx.switchToHttp().getRequest<RequestCtx>();
  if (!user && !data.optional) {
    throw new HttpException('No user in context', 500);
  }
  return user;
});
