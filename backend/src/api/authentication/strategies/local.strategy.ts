import { Injectable, NotImplementedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-local';
import { LoggerService } from '../../../logger/logger.service';
import { AuthStrategy } from '../../../shared/types/auth-strategy';
import { AuthenticationService } from '../authentication.service';

const strategy = AuthStrategy.LOCAL;

/**
 * Strategy used to authenticate the user by credentials.
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, strategy) {
  constructor(
    private readonly service: AuthenticationService,
    private readonly logger: LoggerService
  ) {
    super();
  }

  override async authenticate(request: Request) {
    const { auth, password } = request.body;
    this.logger.debug('Authenticating %s', [auth], { src: 'LocalStrategy::authenticate' });
    try {
      const user = await this.service.authenticateByCredentials(auth, password);
      this.success(user);
    } catch (err) {
      this.error(err);
    }
  }

  override validate() {
    throw new NotImplementedException();
  }
}
