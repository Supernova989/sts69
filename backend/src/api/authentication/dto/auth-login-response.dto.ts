import { Expose } from 'class-transformer';
import { UserRole } from '../../../shared/types/user-role';

export class AuthLoginResponseDto {
  @Expose()
  email: string;

  @Expose()
  id: string;

  @Expose()
  role: UserRole;
}
