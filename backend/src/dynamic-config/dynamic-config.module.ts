import { Global, Module } from '@nestjs/common';
import { DynamicConfigService } from './dynamic-config.service';

@Global()
@Module({
  providers: [DynamicConfigService],
  exports: [DynamicConfigService],
})
export class DynamicConfigModule {}
