import { HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compare as compareHash } from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import { nanoid } from 'nanoid';
import * as NodeRSA from 'node-rsa';
import * as crypto from 'node:crypto';
import { DataSource, Repository } from 'typeorm';
import { DynamicConfigService } from '../../dynamic-config/dynamic-config.service';
import { User } from '../../entities/user';
import { UserSession } from '../../entities/user-session';
import { LoggerService } from '../../logger/logger.service';
import { Environment } from '../../shared/classes/environment';
import { bcryptHash } from '../../shared/func/bcrypt-hash';
import { AccessTokenPayload } from '../../shared/types/access-token-payload';
import { AppCookie } from '../../shared/types/app-cookie';
import { RefreshTokenPayload } from '../../shared/types/refresh-token-payload';
import { UserRole } from '../../shared/types/user-role';
import { AuthRegisterResponseDto } from './dto/auth-register-response.dto';
import {
  CreateUserInput,
  GenerateTokensInput,
  HandleUserSessionInput,
  LoginInput,
  RefreshLoginInput,
  RegisterInput,
} from './typings';

export class AuthenticationService {
  constructor(
    private readonly dataSource: DataSource,
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

  public async login(input: LoginInput): Promise<void> {
    const { user, response, ip, userAgent } = input;

    const userId = user.id;

    let ses = `s-${crypto.createHash('sha256').update(userId).digest('hex')}`;

    if (this.configService.get<boolean>('ENABLE_MULTI_SESSION')) {
      ses = `${ses}-${nanoid()}`;
    }

    const { accessToken, refreshToken } = await this.generateTokens({ sessionId: ses, userId });

    await this.createUserSession({
      sessionId: ses,
      refreshToken,
      ip,
      userAgent,
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

  private async generateTokens(input: GenerateTokensInput) {
    const { sessionId, userId } = input;

    const payload: AccessTokenPayload = {
      ses: sessionId,
      sub: userId,
      jti: nanoid(),
      iss: this.configService.get('JWT_ISSUER'),
    };

    const accessToken: string = this.jwtService.sign(payload);
    const refreshToken: string = await this.getRefreshToken(userId, sessionId);

    return { accessToken, refreshToken };
  }

  private async createUserSession(input: HandleUserSessionInput) {
    const { sessionId, refreshToken, userAgent, ip } = input;
    const session = this.userSessionRepo.create({
      id: sessionId,
      refreshTokenHash: crypto.createHash('sha256').update(refreshToken).digest('hex'),
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
      throw new HttpException('Wrong credentials', HttpStatus.UNAUTHORIZED);
    }
    if (!user.active) {
      throw new HttpException('User is inactive', HttpStatus.UNAUTHORIZED);
    }
    return user;
  }

  public async authenticateByJWT(payload: AccessTokenPayload): Promise<User> {
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

  public async refreshLogin(input: RefreshLoginInput) {
    const { refreshToken, response, ip, userAgent } = input;

    if (typeof refreshToken !== 'string') {
      throw new HttpException('Refresh token required', HttpStatus.BAD_REQUEST);
    }

    const { privateKey } = await this.dynamicConfigService.getConfig('rsa4096');
    const privateRSA4096 = new NodeRSA(privateKey);
    const { sub, ses }: RefreshTokenPayload = JSON.parse(privateRSA4096.decrypt(refreshToken, 'utf8'));

    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sessionRepo = queryRunner.manager.getRepository(UserSession);

      const session = await sessionRepo
        .createQueryBuilder('session')
        .where('session.id = :id', { id: ses })
        .setLock('pessimistic_write')
        .getOne();

      if (!session || session.expired) {
        throw new HttpException('Session expired', HttpStatus.UNAUTHORIZED);
      }

      const compromised =
        session.refreshTokenHash !== refreshTokenHash ||
        (!!session.ip && session.ip !== ip) ||
        (!!session.userAgent && session.userAgent !== userAgent);

      if (compromised) {
        await sessionRepo.update({ id: ses }, { expired: true });
        throw new HttpException('Session compromised', HttpStatus.GONE);
      }

      const newTokens = await this.generateTokens({ sessionId: ses, userId: sub });

      const newRefreshTokenHash = crypto.createHash('sha256').update(newTokens.refreshToken).digest('hex');

      await sessionRepo.update({ id: ses }, { refreshTokenHash: newRefreshTokenHash });

      await queryRunner.commitTransaction();

      response.cookie(AppCookie.ACCESS_TOKEN, newTokens.accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24, // 1 day
      });

      response.cookie(AppCookie.REFRESH_TOKEN, newTokens.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24 * 14, // 14 days
      });

      response.status(204).send();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
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
        throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
      }
      throw err;
    }
  }

  private async getRefreshToken(sub: string, ses: string): Promise<string> {
    const { publicKey } = await this.dynamicConfigService.getConfig('rsa4096');
    const pubRSA4096 = new NodeRSA(publicKey);
    const payload: RefreshTokenPayload = { sub, ses, iat: Date.now() };
    return pubRSA4096.encrypt(payload, 'base64');
  }
}
