import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from '../../../entities/user';
import { Environment } from '../../../shared/classes/environment';
import { AuthStrategy } from '../../../shared/types/auth-strategy';
import { AuthenticationService } from '../authentication.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, AuthStrategy.JWT) {
  constructor(
    private readonly configService: ConfigService<Environment, true>,
    private readonly authenticationService: AuthenticationService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          return req?.cookies?.accessToken || null;
        },
      ]),
      secretOrKey: configService.get<string>('JWT_SECRET'),
      issuer: configService.get<string>('JWT_ISSUER'),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    return this.authenticationService.authenticateByJWT(payload);
  }
}
