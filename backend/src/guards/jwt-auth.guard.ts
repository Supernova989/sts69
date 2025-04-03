import { ExecutionContext, HttpException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { AuthStrategy } from 'src/shared/types/auth-strategy';
import { LoggerService } from '../logger/logger.service';
import { IS_PUBLIC_KEY } from '../shared/decorators/public.decorator';
import { User } from '../entities/user';

/**
 * Authenticates user by the request metadata.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard(AuthStrategy.JWT) {
  constructor(
    private reflector: Reflector,
    private logger: LoggerService
  ) {
    super();
  }

  override canActivate(ctx: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [ctx.getHandler(), ctx.getClass()]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(ctx);
  }

  override handleRequest(err: any, user: any) {
    if (err) {
      this.logger.log('JwtAuthGuard::handleRequest - error 401 - %o', err);
      throw new HttpException(err.message, 401);
    }
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
