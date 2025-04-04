import { ValidationPipeOptions } from '@nestjs/common/pipes/validation.pipe';

export const globalPipeOptions: ValidationPipeOptions = {
  whitelist: true,
  transform: true,
  forbidUnknownValues: true,
  forbidNonWhitelisted: true,
};
