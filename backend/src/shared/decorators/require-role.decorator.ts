import { SetMetadata } from '@nestjs/common';

import { UserRole } from '../types/user-role';

export const REQUIRE_ROLE_KEY = 'REQUIRE_ROLE_KEY';

/**
 * Allows a controller or its method to work only with the specified user roles.
 * @param role
 */
export const RequireRole = (...role: UserRole[]) => {
  return SetMetadata(REQUIRE_ROLE_KEY, role);
};
