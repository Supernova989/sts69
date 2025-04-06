import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { AuthStrategy } from 'src/shared/types/auth-strategy';
import { LoggerService } from '../logger/logger.service';
import { IS_PUBLIC_KEY } from '../shared/decorators/public.decorator';

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

  override handleRequest(err: any, user: any, info) {
    if (err || info) {
      throw new UnauthorizedException((err || info).message);
    }
    if (!user) {
      throw new UnauthorizedException('No user authenticated');
    }
    return user;
  }
}
