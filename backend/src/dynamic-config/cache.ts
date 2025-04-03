import { IsString, ValidateNested } from 'class-validator';
import { Property } from '../shared/func/get-class-props';

export class RSA {
  @IsString()
  privateKey: string;

  @IsString()
  publicKey: string;
}

export class ConfigurationCache {
  @Property()
  @ValidateNested()
  rsa512: RSA;

  @Property()
  @ValidateNested()
  rsa4096: RSA;
}
