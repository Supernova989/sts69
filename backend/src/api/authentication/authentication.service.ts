import { HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compare as compareHash } from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import { Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import * as NodeRSA from 'node-rsa';
import * as crypto from 'node:crypto';
import { Repository } from 'typeorm';
import { DynamicConfigService } from '../../dynamic-config/dynamic-config.service';
import { User } from '../../entities/user';
import { UserSession } from '../../entities/user-session';
import { LoggerService } from '../../logger/logger.service';
import { Environment } from '../../shared/classes/environment';
import { bcryptHash } from '../../shared/func/bcrypt-hash';
import { AppCookie } from '../../shared/types/app-cookie';
import { UserRole } from '../../shared/types/user-role';
import { AuthRegisterResponseDto } from './dto/auth-register-response.dto';
import { CreateUserInput, HandleUserSessionInput, RegisterInput } from './typings';

export class AuthenticationService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(UserSession) private readonly userSessionRepo: Repository<UserSession>,
    private readonly dynamicConfigService: DynamicConfigService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<Environment, true>,
    private readonly logger: LoggerService
  ) {}

  public async getPublicKey(b: '512' | '4096') {
    return this.dynamicConfigService.getConfig(`rsa${b}`).then((r) => r.publicKey);
  }

  public async register(input: RegisterInput): Promise<AuthRegisterResponseDto> {
    const { privateKey } = await this.dynamicConfigService.getConfig('rsa512');

    const { email, firstname, password, lastname } = input;
    const privateRSA512 = new NodeRSA(privateKey);

    let plainPassword = '';

    try {
      plainPassword = privateRSA512.decrypt(password, 'utf8');
    } catch (e: any) {
      this.logger.debug('Failed to register user - %s', [e.message]);
      throw new HttpException('Registration failed', 400);
    }

    const createdUser = await this.createUser({ email, plainPassword, firstname, lastname });

    this.logger.log('New user has registered - [%s]', [createdUser.email]);

    return plainToInstance(AuthRegisterResponseDto, createdUser, { excludeExtraneousValues: true });
  }

  public async login(user: User, response: Response): Promise<void> {
    const sub = user.id;

    let ses = `s-${crypto.createHash('sha256').update(sub).digest('hex')}`;

    if (this.configService.get<boolean>('ENABLE_MULTI_SESSION')) {
      ses = `${ses}-${nanoid()}`;
    }

    const payload: JwtPayload = {
      ses,
      sub,
      jti: nanoid(),
      iss: this.configService.get('JWT_ISSUER'),
    };

    const accessToken: string = this.jwtService.sign(payload);
    const refreshToken: string = await this.getRefreshToken(sub, ses);

    await this.createUserSession({
      sessionId: ses,
      refreshToken,
      // userId: sub,
    });

    response.cookie(AppCookie.ACCESS_TOKEN, accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    });

    response.cookie(AppCookie.REFRESH_TOKEN, refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24 * 14, // 14 days
    });

    response.status(200).send(plainToInstance(AuthRegisterResponseDto, user, { excludeExtraneousValues: true }));
  }

  private async createUserSession(input: HandleUserSessionInput) {
    const { sessionId, refreshToken, userAgent, ip } = input;
    const session = this.userSessionRepo.create({
      id: sessionId,
      refreshTokenHash: crypto.createHash('sha256').update(refreshToken).digest('hex'),
      // userId,
      userAgent,
      ip,
    });

    return this.userSessionRepo.save(session);
  }

  public async authenticateByCredentials(email: string, password: string): Promise<User> {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    if (!user?.password || !(await compareHash(password, user.password))) {
      throw new HttpException('Wrong credentials', 401);
    }
    if (!user.active) {
      throw new HttpException('User is inactive', 401);
    }
    return user;
  }

  public async authenticateByJWT(payload: JwtPayload): Promise<User> {
    const [user, session] = await Promise.all([
      this.userRepo.findOne({ where: { id: payload.sub } }),
      this.userSessionRepo.findOne({ where: { id: payload.ses } }),
    ]);

    if (!user) {
      throw new Error('User does not exist');
    }
    if (!user.active) {
      throw new Error('User is inactive');
    }
    if (!session || session.expired) {
      throw new Error('Session expired');
    }
    return user;
  }

  private async createUser(input: CreateUserInput): Promise<User> {
    try {
      const { email, plainPassword, firstname, lastname } = input;

      const user = this.userRepo.create({
        email,
        password: bcryptHash(plainPassword),
        firstname: firstname ?? null,
        lastname: lastname ?? null,
        role: UserRole.CUSTOMER,
        active: false,
      });

      return await this.userRepo.save(user);
    } catch (err: any) {
      if (err.code === '23505') {
        // Postgres code for "Duplicate key value" error
        throw new HttpException('User already exists', 400);
      }
      throw err;
    }
  }

  private async getRefreshToken(sub: string, ses: string): Promise<string> {
    const { publicKey } = await this.dynamicConfigService.getConfig('rsa4096');
    const pubRSA4096 = new NodeRSA(publicKey);
    const data = { sub, ses, iat: Date.now() };
    return pubRSA4096.encrypt(data, 'base64');
  }
}
