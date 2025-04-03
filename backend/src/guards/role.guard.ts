import { CanActivate, ExecutionContext, HttpException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_ROLE_KEY } from '../shared/decorators/require-role.decorator';
import { RequestCtx } from '../shared/types/request-ctx';
import { UserRole } from '../shared/types/user-role';

/**
 * Implements logic for decorator RequireRole.
 */
@Injectable()
export class RoleGuard implements CanActivate {
  private readonly reflector: Reflector;

  constructor() {
    this.reflector = new Reflector();
  }

  canActivate(ctx: ExecutionContext): boolean {
    const { user } = ctx.switchToHttp().getRequest<RequestCtx>();

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(REQUIRE_ROLE_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!requiredRoles?.length) {
      return true;
    }
    if (!user || !requiredRoles.some((s) => user.role === s)) {
      throw new HttpException('Forbidden', 403);
    }
    return true;
  }
}
