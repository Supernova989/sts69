import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { LoggerService } from '../../../logger/logger.service';
import { AuthStrategy } from '../../../shared/types/auth-strategy';
import { AuthenticationService } from '../authentication.service';

const strategy = AuthStrategy.JWT;

/**
 * Local strategy.
 *
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, strategy) {
  constructor(
    private readonly service: AuthenticationService,
    private readonly logger: LoggerService
  ) {
    super();
  }

  override async authenticate(request: unknown) {
    const { auth, password } = request as { auth: string; password: string };
    this.logger.debug('Authenticating %s...', [auth], { src: 'LocalStrategy::authenticate' });
    try {
      const user = await this.service.authenticateByCredentials(auth, password);
      this.success(user);
    } catch (e) {
      this.fail(e);
    }
  }

  validate(args: any) {
    console.log('here - validate >>>>>', args);
    return undefined;
  }
}
