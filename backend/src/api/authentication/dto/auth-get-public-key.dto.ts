import { IsEnum } from 'class-validator';

export class AuthGetPublicKeyDto {
  @IsEnum(['512', '4096'])
  bits: '512' | '4096';
}
