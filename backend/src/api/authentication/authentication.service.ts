import { HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import NodeRSA from 'node-rsa';
import { Repository } from 'typeorm';
import { DynamicConfigService } from '../../dynamic-config/dynamic-config.service';
import { User } from '../../entities/user';
import { LoggerService } from '../../logger/logger.service';
import { bcryptHash } from '../../shared/func/bcrypt-hash';
import { UserType } from '../../shared/types/user-type';
import { AuthRegisterResponseDto } from './dto/auth-register-response.dto';
import { CreateUserInput, RegisterInput } from './typings';

export class AuthenticationService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly cfgService: DynamicConfigService,
    private readonly logger: LoggerService
  ) {}

  public async register(input: RegisterInput): Promise<AuthRegisterResponseDto> {
    const { privateKey } = await this.cfgService.getConfig('rsa512');

    const { email, firstname, password, lastname } = input;
    const privateRSA512 = new NodeRSA(privateKey);

    let plainPassword = '';

    try {
      plainPassword = privateRSA512.decrypt(password, 'base64');
    } catch (e: any) {
      this.logger.debug('Failed to register user - %s', [e.message]);
      throw new HttpException('Registration failed', 400);
    }

    const createdUser = await this.createUser({ email, plainPassword, firstname, lastname });

    this.logger.log('Registered user [%s]', [createdUser.email]);

    return {};
  }

  public async authenticateByCredentials() {}

  public async authenticateByJWT() {}

  private async createUser(input: CreateUserInput): Promise<User> {
    const { email, plainPassword, firstname, lastname } = input;

    const user = this.userRepository.create({
      email,
      password: bcryptHash(plainPassword),
      firstname: firstname ?? null,
      lastname: lastname ?? null,
      type: UserType.CUSTOMER,
      active: false,
    });

    return this.userRepository.save(user);
  }
}
