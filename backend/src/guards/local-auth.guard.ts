import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthStrategy } from '../shared/types/auth-strategy';

const strategyName = AuthStrategy.LOCAL;

export class LocalAuthGuard extends AuthGuard(strategyName) {
  override canActivate(ctx: ExecutionContext) {
    return super.canActivate(ctx);
  }
}
