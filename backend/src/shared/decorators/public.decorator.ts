import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'IS_PUBLIC_KEY';

/**
 * Makes a controller or its method public.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
