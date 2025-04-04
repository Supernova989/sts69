import { Type } from 'class-transformer';
import { IsString, ValidateNested } from 'class-validator';
import { Property } from '../shared/func/get-class-props';

export class RSA {
  @IsString()
  privateKey: string;

  @IsString()
  publicKey: string;
}

export class Stripe {
  enable: boolean;
}

export class ConfigurationCache {
  @Property()
  @ValidateNested()
  @Type(() => RSA)
  rsa512: RSA;

  @Property()
  @ValidateNested()
  @Type(() => RSA)
  rsa4096: RSA;

  @Property()
  @ValidateNested()
  @Type(() => Stripe)
  stripe: Stripe;
}
